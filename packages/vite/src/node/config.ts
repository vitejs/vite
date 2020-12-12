import fs from 'fs'
import path from 'path'
import Rollup, { Plugin as RollupPlugin, RollupOptions } from 'rollup'
import { BuildOptions, BuildHook } from './build'
import { ServerOptions, ServerHook } from './server'
import { CSSOptions } from './plugins/css'
import { createDebugger, deepMerge, isObject, lookupFile } from './utils'
import { resolvePlugins } from './plugins'
import chalk from 'chalk'
import { esbuildPlugin } from './plugins/esbuild'
import { TransformOptions as ESbuildTransformOptions } from 'esbuild'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { IndexHtmlTransform } from './plugins/html'
import { Alias, AliasOptions } from 'types/alias'

const debug = createDebugger('vite:config')

/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export const FILE_PREFIX = `/@fs/`
export const CLIENT_PUBLIC_PATH = '/@vite/client'
// eslint-disable-next-line
export const CLIENT_ENTRY = require.resolve('vite/dist/client/client.js')
export const CLIENT_DIR = path.dirname(CLIENT_ENTRY)

export interface ConfigEnv {
  command: 'build' | 'serve'
  mode: string
}

export type UserConfigFn = (env: ConfigEnv) => UserConfig
export type UserConfigExport = UserConfig | UserConfigFn

// type helper to make it easier to use vite.config.ts
export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}

export interface UserConfig {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  /**
   * Import aliases
   */
  alias?: AliasOptions
  /**
   * Define global variable replacements.
   * Entries will be defined on `window` during dev and replaced during build.
   */
  define?: Record<string, string>
  /**
   * CSS related options (preprocessors and CSS modules)
   */
  css?: CSSOptions
  /**
   * Function that tests a file path for inclusion as a static asset.
   */
  assetsInclude?: (file: string) => boolean
  /**
   * Transform options to pass to esbuild.
   * Or set to `false` to disable esbuild.
   */
  esbuild?: ESbuildTransformOptions | false
  /**
   * List of vite plugins to use.
   */
  plugins?: (Plugin | Plugin[])[]
  /**
   * Universal rollup options (used in both serve and build)
   * Use function config to use conditional options for serve/build
   */
  rollupOptions?: RollupOptions
  /**
   * Server specific options, e.g. host, port, https...
   */
  server?: ServerOptions
  /**
   * Build specific options
   */
  build?: BuildOptions
}

export type ConfigHook = (config: UserConfig) => UserConfig | void

/**
 * Vite plugins support a subset of Rollup plugin API with a few extra
 * vite-specific options. A valid vite plugin is also a valid Rollup plugin.
 * On the contrary, a Rollup plugin may or may NOT be a valid vite universal
 * plugin, since some Rollup features do not make sense in an unbundled
 * dev server context.
 *
 * By default, the plugins are run during both serve and build. When a plugin
 * is applied during serve, it will only run **non output plugin hooks** (see
 * rollup type definition PluginHooks). You can think of the dev server as
 * only running `const bundle = rollup.rollup()` but never calling
 * `bundle.generate()`.
 *
 * A plugin that expects to have different behavior depending on serve/build can
 * export a factory function that receives the command being run via options.
 *
 * If a plugin should be applied only for server or build, a function format
 * config file can be used to conditional determine the plugins to use.
 */
export interface Plugin extends RollupPlugin {
  /**
   * Enforce plugin invocation tier similar to webpack loaders
   */
  enforce?: 'pre' | 'post'
  /**
   * Mutate or return new vite config before it's resolved.
   * Note user plugins are resolved before this hook so adding plugins inside
   * a plugin's modifyConfig hook will have no effect.
   */
  modifyConfig?: ConfigHook
  /**
   * Configure the vite server. The hook receives the server context object
   * which exposes the following
   * - `config`: resolved project config
   * - `server`: native http server
   * - `app`: the connect middleware app
   * - `watcher`: the chokidar file watcher
   * - `ws`: a websocket server that can send messages to the client
   * - `container`: the plugin container
   *
   * The hooks will be called before internal middlewares are applied. A hook
   * can return a post hook that will be called after internal middlewares
   * are applied. Hook can be async functions and will be called in series.
   */
  configureServer?: ServerHook
  /**
   * Configure production build. The hook receives the rollup config which
   * it can mutate or return. Passing multiple build hooks will produce multiple
   * builds similar to a multi-config rollup build.
   */
  configureBuild?: BuildHook | BuildHook[]
  /**
   * Transform index.html.
   * The hook receives the following arguments:
   *
   * - html: string
   * - ctx?: vite.ServerContext (only present during serve)
   * - bundle?: rollup.OutputBundle (only present during build)
   *
   * It can either return a transformed string, or a list of html tag
   * descriptors that will be injected into the <head> or <body>.
   *
   * By default the transform is applied **after** vite's internal html
   * transform. If you need to apply the transform before vite, use an object:
   * `{ enforce: 'pre', transform: hook }`
   */
  transformIndexHtml?: IndexHtmlTransform
}

export type ResolvedConfig = Readonly<
  Omit<UserConfig, 'plugins'> & {
    configPath: string | null
    root: string
    mode: string
    env: Record<string, string>
    plugins: readonly Plugin[]
    server: ServerOptions
    build: BuildOptions
  }
>

export async function resolveConfig(
  config: UserConfig,
  command: 'build' | 'serve',
  mode: string,
  configPath?: string | false
): Promise<ResolvedConfig> {
  if (configPath !== false) {
    const loadResult = await loadConfigFromFile(
      {
        mode,
        command
      },
      configPath
    )
    if (loadResult) {
      config = deepMerge(loadResult.config, config)
      configPath = loadResult.path
    }
  }

  // resolve plugins
  const { plugins } = config
  const prePlugins: Plugin[] = []
  const postPlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }

  // run modifyConfig hooks
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins]
  userPlugins.forEach((p) => {
    if (p.modifyConfig) {
      config = p.modifyConfig(config) || config
    }
  })

  // resolve root
  const { root } = config
  const resolvedRoot = root
    ? path.isAbsolute(root)
      ? root
      : path.resolve(root)
    : process.cwd()

  // resolve alias - inject internal alias for /@vite/ client files
  const userAlias = config.alias || []
  const normalizedAlias: Alias[] = isObject(userAlias)
    ? Object.keys(userAlias).map((find) => ({
        find,
        replacement: (userAlias as any)[find]
      }))
    : userAlias
  const resolvedAlias = [
    { find: /^\/@vite\//, replacement: CLIENT_DIR + '/' },
    ...normalizedAlias
  ]

  const resolved = {
    ...config,
    configPath: configPath || null,
    root: resolvedRoot,
    mode,
    alias: resolvedAlias,
    plugins: userPlugins,
    server: config.server || {},
    build: config.build || {},
    env: loadEnv(mode, resolvedRoot)
  }

  resolved.plugins = resolvePlugins(
    command,
    resolved,
    prePlugins,
    normalPlugins,
    postPlugins
  )

  if (process.env.DEBUG) {
    debug(`using resolved config: %O`, {
      ...resolved,
      plugins: resolved.plugins.map((p) => p.name)
    })
  }
  return resolved
}

async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configPath?: string
): Promise<{ path: string; config: UserConfig } | null> {
  const start = Date.now()
  const cwd = process.cwd()

  let resolvedPath: string | undefined
  if (configPath) {
    resolvedPath = path.resolve(cwd, configPath)
  } else {
    const jsConfigPath = path.resolve(cwd, 'vite.config.js')
    if (fs.existsSync(jsConfigPath)) {
      resolvedPath = jsConfigPath
    } else {
      const tsConfigPath = path.resolve(cwd, 'vite.config.ts')
      if (fs.existsSync(tsConfigPath)) {
        resolvedPath = tsConfigPath
      }
    }
  }

  if (!resolvedPath) {
    debug('no config file found.')
    return null
  }

  const isTS = resolvedPath.endsWith('.ts')
  try {
    let userConfig: UserConfigExport | undefined

    if (!isTS) {
      // 1. try to directly require the module (assuming commonjs)
      try {
        userConfig = require(resolvedPath)
        debug(`cjs config loaded in ${Date.now() - start}ms`)
      } catch (e) {
        const ignored = /Cannot use import statement|Unexpected token 'export'|Must use import to load ES Module/
        if (!ignored.test(e.message)) {
          throw e
        }
      }
    }

    if (!userConfig) {
      // 2. if we reach here, the file is ts or using es import syntax, or
      // the user has type: "module" in their package.json (#917)
      // transpile es import syntax to require syntax using rollup.
      // lazy require rollup (it's actually in dependencies)
      const rollup = require('rollup') as typeof Rollup
      // node-resolve must be imported since it's bundled
      const bundle = await rollup.rollup({
        external: (id: string) =>
          (id[0] !== '.' && !path.isAbsolute(id)) ||
          id.slice(-5, id.length) === '.json',
        input: resolvedPath,
        treeshake: false,
        plugins: [
          // use esbuild + node-resolve to support .ts files
          esbuildPlugin({ target: 'es2019' }),
          nodeResolve({
            extensions: ['.mjs', '.js', '.ts', '.json']
          })
        ]
      })

      const {
        output: [{ code }]
      } = await bundle.generate({
        exports: 'named',
        format: 'cjs'
      })

      userConfig = await loadConfigFromBundledFile(resolvedPath, code)
      debug(
        `${isTS ? 'ts' : 'es'} config file loaded in ${Date.now() - start}ms`
      )
    }

    const config =
      typeof userConfig === 'function' ? userConfig(configEnv) : userConfig
    if (!isObject(config)) {
      throw new Error(`config must export or return an object.`)
    }
    return {
      path: resolvedPath,
      config
    }
  } catch (e) {
    console.error(
      chalk.red(`[vite] failed to load config from ${resolvedPath}:`)
    )
    console.error(e.stack)
    process.exit(1)
  }
}

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any
}

async function loadConfigFromBundledFile(
  fileName: string,
  bundledCode: string
): Promise<UserConfig> {
  const extension = path.extname(fileName)
  const defaultLoader = require.extensions[extension]!
  require.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === fileName) {
      ;(module as NodeModuleWithCompile)._compile(bundledCode, filename)
    } else {
      defaultLoader(module, filename)
    }
  }
  delete require.cache[fileName]
  const raw = require(fileName)
  const config = raw.__esModule ? raw.default : raw
  require.extensions[extension] = defaultLoader
  return config
}

function loadEnv(mode: string, root: string, prefix = 'VITE_') {
  if (mode === 'local') {
    throw new Error(
      `"local" cannot be used as a mode name because it conflicts with ` +
        `the .local postfix for .env files.`
    )
  }

  const env: Record<string, string> = {}
  const envFiles = [
    /** mode local file */ `.env.${mode}.local`,
    /** mode file */ `.env.${mode}`,
    /** local file */ `.env.local`,
    /** default file */ `.env`
  ]

  for (const file of envFiles) {
    const path = lookupFile(root, [file], true)
    if (path) {
      const parsed = dotenv.parse(fs.readFileSync(path), {
        debug: !!process.env.DEBUG || undefined
      })

      // let environment variables use each other
      dotenvExpand({
        parsed,
        // prevent process.env mutation
        ignoreProcessEnv: true
      } as any)

      // only keys that start with prefix are exposed.
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith(prefix) && env[key] === undefined) {
          env[key] = value
        }
      }
    }
  }

  return env
}
