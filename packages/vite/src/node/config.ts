import fs from 'fs'
import path from 'path'
import { Plugin } from './plugin'
import Rollup from 'rollup'
import { BuildOptions, resolveBuildOptions } from './build'
import { ServerOptions } from './server'
import { CSSOptions } from './plugins/css'
import {
  createDebugger,
  deepMerge,
  isObject,
  lookupFile,
  normalizePath
} from './utils'
import { resolvePlugins } from './plugins'
import chalk from 'chalk'
import { esbuildPlugin } from './plugins/esbuild'
import { TransformOptions as ESbuildTransformOptions } from 'esbuild'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { Alias, AliasOptions } from 'types/alias'
import { CLIENT_DIR, DEFAULT_ASSETS_RE } from './constants'
import { resolvePlugin } from './plugins/resolve'
import { createLogger, LogLevel } from './logger'

const debug = createDebugger('vite:config')

export interface ConfigEnv {
  command: 'build' | 'serve'
  mode: string
}

export type UserConfigFn = (env: ConfigEnv) => UserConfig
export type UserConfigExport = UserConfig | UserConfigFn

/**
 * Type helper to make it easier to use vite.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 * `command` (either `'build'` or `'serve'`), and `mode`.
 */
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
  define?: Record<string, any>
  /**
   * List of vite plugins to use.
   */
  plugins?: (Plugin | Plugin[])[]
  /**
   * CSS related options (preprocessors and CSS modules)
   */
  css?: CSSOptions
  /**
   * Transform options to pass to esbuild.
   * Or set to `false` to disable esbuild.
   */
  esbuild?: ESbuildTransformOptions | false
  /**
   * Function that tests a file path for inclusion as a static asset.
   */
  assetsInclude?: (file: string) => boolean
  /**
   * Server specific options, e.g. host, port, https...
   */
  server?: ServerOptions
  /**
   * Build specific options
   */
  build?: BuildOptions
  /**
   * Log level
   * @default 'all'
   */
  logLevel?: LogLevel
}

export type ResolvedConfig = Readonly<
  Omit<UserConfig, 'plugins'> & {
    configPath: string | null
    root: string
    command: 'build' | 'serve'
    mode: string
    isProduction: boolean
    env: Record<string, any>
    plugins: readonly Plugin[]
    server: ServerOptions
    build: Required<BuildOptions>
    assetsInclude: (file: string) => boolean
  }
>

export async function resolveConfig(
  cliConfig: UserConfig,
  command: 'build' | 'serve',
  mode: string,
  configPath?: string | false
): Promise<ResolvedConfig> {
  let config = cliConfig

  if (configPath !== false) {
    const loadResult = await loadConfigFromFile(
      {
        mode,
        command
      },
      configPath,
      config.logLevel
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

  // run config hooks
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins]
  userPlugins.forEach((p) => {
    if (p.config) {
      config = p.config(config) || config
    }
  })

  // resolve root
  const resolvedRoot = normalizePath(
    config.root ? path.resolve(config.root) : process.cwd()
  )

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

  const userEnv = loadEnv(mode, resolvedRoot)

  // Note it is possible for user to have a custom mode, e.g. `staging` where
  // production-like behavior is expected. This is indicated by NODE_ENV=production
  // loaded from `.staging.env` and set by us as VITE_USER_NODE_ENV
  const resolvedMode = process.env.VITE_USER_NODE_ENV || mode
  const isProduction = resolvedMode === 'production'

  const resolved = {
    ...config,
    configPath: configPath ? normalizePath(configPath) : null,
    root: resolvedRoot,
    command,
    mode,
    isProduction,
    alias: resolvedAlias,
    plugins: userPlugins,
    server: config.server || {},
    build: resolveBuildOptions(config.build),
    assetsInclude: (file: string) => {
      return (
        DEFAULT_ASSETS_RE.test(file) || config.assetsInclude?.(file) || false
      )
    },
    env: {
      ...userEnv,
      BASE_URL: '/', // TODO
      MODE: mode,
      DEV: !isProduction,
      PROD: isProduction
    }
  }

  resolved.plugins = resolvePlugins(
    resolved,
    prePlugins,
    normalPlugins,
    postPlugins
  )

  // call configResolved hooks
  userPlugins.forEach((p) => {
    if (p.configResolved) {
      p.configResolved(resolved)
    }
  })

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
  configPath?: string,
  logLevel?: LogLevel
): Promise<{ path: string; config: UserConfig } | null> {
  const start = Date.now()

  let resolvedPath: string | undefined
  if (configPath) {
    // explicit config path is always resolved from cwd
    resolvedPath = path.resolve(configPath)
  } else {
    const jsConfigPath = path.resolve('vite.config.js')
    if (fs.existsSync(jsConfigPath)) {
      resolvedPath = jsConfigPath
    } else {
      const tsConfigPath = path.resolve('vite.config.ts')
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
          resolvePlugin(
            path.dirname(resolvedPath),
            true /* isBuild */,
            false /* disallow url resolves */
          )
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
    createLogger(logLevel).error(
      chalk.red(`[vite] failed to load config from ${resolvedPath}`)
    )
    throw e
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

      // only keys that start with prefix are exposed to client
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith(prefix) && env[key] === undefined) {
          env[key] = value
        } else if (key === 'NODE_ENV') {
          // NODE_ENV override in .env file
          process.env.VITE_USER_NODE_ENV = value
        }
      }
    }
  }

  return env
}
