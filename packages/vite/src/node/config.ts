import fs from 'fs'
import path from 'path'
import { TransformOptions } from 'esbuild'
import Rollup, { Plugin as RollupPlugin, RollupOptions } from 'rollup'
import { BuildOptions, BuildHook } from './build'
import { ServerOptions, ServerHook } from './server'
import { CSSOptions } from './plugins/css'
import { deepMerge, isObject, lookupFile } from './utils'
import { internalPlugins } from './plugins'
import chalk from 'chalk'
import { esbuildPlugin } from './plugins/esbuild'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const debug = require('debug')('vite:config')

export interface ConfigEnv {
  command: 'build' | 'serve'
  mode: string
}

export type UserConfigExport = UserConfig | ((env: ConfigEnv) => UserConfig)

// type helper to make it easier to use vite.config.ts
export function defineConfig(config: UserConfigExport) {
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
  alias?: Record<string, string>
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
   * esbuild options (disable, jsx, minify)
   */
  esbuild?: ESBuildOptions | false
  /**
   * Vite plugins support a subset of Rollup plugin API with a few extra
   * vite-specific options. A valid vite plugin is also a valid Rollup plugin.
   * On the contrary, a Rollup plugin may or may NOT be a valid vite universal
   * plugin, since some Rollup features do not make sense in an unbundled
   * dev server context.
   *
   * By default, the plugins are run during both serve and build. If a plugin
   * should be only applied for server or build, use a function format config
   * file to conditionally include it:
   *
   * ```js
   * // vite.config.js
   * export default (env) => ({
   *   plugins: env.isBuild
   *    ? [...universalPlugins, ...buildOnlyPlugins]
   *    : [...universalPlugins, ...serveOnlyPlugins]
   * })
   * ```
   *
   * @TODO validate and warn plugins that will not work during serve
   */
  plugins?: UniversalPlugin[]
  /**
   * Universal rollup options (used in both serve and build)
   * Use function config to use conditional options for serve/build
   */
  rollupOptions?: RollupOptions
  build?: BuildOptions
  server?: ServerOptions
}

export { ServerOptions, BuildOptions, CSSOptions }

export type ESBuildOptions = Pick<
  TransformOptions,
  'target' | 'jsxFactory' | 'jsxFragment'
>

export type ConfigHook = (config: UserConfig) => UserConfig | void

export interface UniversalPlugin extends RollupPlugin {
  /**
   * Enforce plugin invocation tier similar to webpack loaders
   */
  enforce?: 'pre' | 'post'
  /**
   * Mutate or return new vite config before it's resolved.
   * Note: plugins are resolved before running this hook so additional plugins
   * injected in this hook will be ignored.
   */
  modifyConfig?: ConfigHook
  /**
   * Configure the vite server. The hook receives the server context.
   */
  configureServer?: ServerHook
  /**
   * Configure production build. The hook receives the rollup config which
   * it can mutate or return. Passing multiple build hooks will produce multiple
   * builds similar to a multi-config rollup build.
   */
  configureBuild?: BuildHook | BuildHook[]
}

/**
 * @internal
 */
export interface ResolvedConfig extends UserConfig {
  root: string
  mode: string
  env: Record<string, string>
  plugins: UniversalPlugin[]
  server: ServerOptions
  build: BuildOptions
  debug?: boolean
}

export async function resolveConfig(
  config: UserConfig,
  command: 'build' | 'serve',
  mode: string,
  configPath?: string
): Promise<ResolvedConfig> {
  const fileConfig = await loadConfigFromFile(
    {
      mode,
      command
    },
    configPath
  )

  if (fileConfig) {
    config = deepMerge(fileConfig, config)
  }

  // resolve plugins
  const { plugins } = config
  const prePlugins: UniversalPlugin[] = []
  const postPlugins: UniversalPlugin[] = []
  const normalPlugins: UniversalPlugin[] = []
  if (plugins) {
    plugins.forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }
  const resolvedPlugins = [
    ...prePlugins,
    ...internalPlugins,
    ...normalPlugins,
    ...postPlugins
  ]

  // run modifyConfig hooks
  resolvedPlugins.forEach((p) => {
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

  const resolved = {
    ...config,
    root: resolvedRoot,
    mode,
    plugins: resolvedPlugins,
    server: config.server || {},
    build: config.build || {},
    env: loadEnv(mode, resolvedRoot)
  }
  debug(`using resolved config:`)
  debug(resolved)
  return resolved
}

export async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configPath?: string
): Promise<UserConfig> {
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
    return {}
  }

  const isTS = resolvedPath.endsWith('.ts')
  try {
    let userConfig: UserConfigExport | undefined

    if (!isTS) {
      // 1. try to directly require the module (assuming commonjs)
      try {
        userConfig = require(resolvedPath)
        debug(`config file loaded in ${Date.now() - start}ms`)
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
      const rollup = require('rollup') as typeof Rollup
      const bundle = await rollup.rollup({
        external: (id: string) =>
          (id[0] !== '.' && !path.isAbsolute(id)) ||
          id.slice(-5, id.length) === '.json',
        input: resolvedPath,
        treeshake: false,
        plugins: [
          // use esbuild + node-resolve to support .ts files
          esbuildPlugin({ target: 'es2019' }),
          require('@rollup/plugin-node-resolve').nodeResolve({
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
      debug(`config file loaded in ${Date.now() - start}ms`)
    }

    const config =
      typeof userConfig === 'function' ? userConfig(configEnv) : userConfig
    if (!isObject(config)) {
      throw new Error(`config must export or return an object.`)
    }
    return config
  } catch (e) {
    console.error(
      chalk.red(`[vite] failed to load config from ${resolvedPath}:`)
    )
    console.error(e)
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
