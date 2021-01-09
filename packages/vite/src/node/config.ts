import fs from 'fs'
import path from 'path'
import { Plugin } from './plugin'
import Rollup from 'rollup'
import { BuildOptions, resolveBuildOptions } from './build'
import { ServerOptions } from './server'
import { CSSOptions } from './plugins/css'
import { createDebugger, isObject, lookupFile, normalizePath } from './utils'
import { resolvePlugins } from './plugins'
import chalk from 'chalk'
import { ESBuildOptions, esbuildPlugin } from './plugins/esbuild'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { Alias, AliasOptions } from 'types/alias'
import { CLIENT_DIR, DEFAULT_ASSETS_RE, DEP_CACHE_DIR } from './constants'
import { resolvePlugin } from './plugins/resolve'
import { createLogger, Logger, LogLevel } from './logger'
import { DepOptimizationOptions } from './optimizer'
import { createFilter } from '@rollup/pluginutils'

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
   * Explicitly set a mode to run in. This will override the default mode for
   * each command, and can be overridden by the command line --mode option.
   */
  mode?: string
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
   * Array of vite plugins to use.
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
  esbuild?: ESBuildOptions | false
  /**
   * Specify additional files to be treated as static assets.
   */
  assetsInclude?: string | RegExp | (string | RegExp)[]
  /**
   * Server specific options, e.g. host, port, https...
   */
  server?: ServerOptions
  /**
   * Build specific options
   */
  build?: BuildOptions
  /**
   * Dep optimization options
   */
  optimizeDeps?: DepOptimizationOptions
  /**
   * Force Vite to always resolve listed dependencies to the same copy (from
   * project root).
   */
  dedupe?: string[]
  /**
   * Log level.
   * Default: 'info'
   */
  logLevel?: LogLevel
}

export interface InlineConfig extends UserConfig {
  configFile?: string | false
}

export type ResolvedConfig = Readonly<
  Omit<UserConfig, 'plugins' | 'alias' | 'assetsInclude'> & {
    configFile: string | undefined
    inlineConfig: UserConfig
    root: string
    command: 'build' | 'serve'
    mode: string
    isProduction: boolean
    optimizeCacheDir: string | undefined
    env: Record<string, any>
    alias: Alias[]
    plugins: readonly Plugin[]
    server: ServerOptions
    build: Required<BuildOptions>
    assetsInclude: (file: string) => boolean
    logger: Logger
  }
>

export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode = 'development'
): Promise<ResolvedConfig> {
  let config = inlineConfig
  let mode = inlineConfig.mode || defaultMode

  // some dependencies e.g. @vue/compiler-* relies on NODE_ENV for getting
  // production-specific behavior, so set it here even though we haven't
  // resolve the final mode yet
  if (mode === 'production') {
    process.env.NODE_ENV = 'production'
  }

  let { configFile } = config
  if (configFile !== false) {
    const loadResult = await loadConfigFromFile(
      {
        mode,
        command
      },
      configFile,
      config.root,
      config.logLevel
    )
    if (loadResult) {
      config = mergeConfig(loadResult.config, config)
      configFile = loadResult.path
    }
  }
  // user config may provide an alternative mode
  mode = config.mode || mode

  // resolve plugins
  const rawUserPlugins = (config.plugins || []).flat().filter((p) => {
    return !p.apply || p.apply === command
  })
  const [prePlugins, postPlugins, normalPlugins] = sortUserPlugins(
    rawUserPlugins
  )

  // run config hooks
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins]
  userPlugins.forEach((p) => {
    if (p.config) {
      const res = p.config(config)
      if (res) {
        config = mergeConfig(config, res)
      }
    }
  })

  // resolve root
  const resolvedRoot = normalizePath(
    config.root ? path.resolve(config.root) : process.cwd()
  )

  // resolve alias with internal client alias
  const resolvedAlias = mergeAlias(
    [{ find: /^\/@vite\//, replacement: CLIENT_DIR + '/' }],
    config.alias || []
  )

  // load .env files
  const userEnv = loadEnv(mode, resolvedRoot)

  // Note it is possible for user to have a custom mode, e.g. `staging` where
  // production-like behavior is expected. This is indicated by NODE_ENV=production
  // loaded from `.staging.env` and set by us as VITE_USER_NODE_ENV
  const isProduction = (process.env.VITE_USER_NODE_ENV || mode) === 'production'
  if (isProduction) {
    // in case default mode was not production and is overwritten
    process.env.NODE_ENV = 'production'
  }

  const resolvedBuildOptions = resolveBuildOptions(config.build)

  // resolve optimizer cache directory
  const pkgPath = lookupFile(
    resolvedRoot,
    [`package.json`],
    true /* pathOnly */
  )
  const optimizeCacheDir =
    pkgPath && path.join(path.dirname(pkgPath), `node_modules/${DEP_CACHE_DIR}`)

  const assetsFilter = config.assetsInclude
    ? createFilter(config.assetsInclude)
    : () => false

  const resolved = {
    ...config,
    configFile: configFile ? normalizePath(configFile) : undefined,
    inlineConfig,
    root: resolvedRoot,
    command,
    mode,
    isProduction,
    optimizeCacheDir,
    alias: resolvedAlias,
    plugins: userPlugins,
    server: config.server || {},
    build: resolvedBuildOptions,
    env: {
      ...userEnv,
      BASE_URL: command === 'build' ? resolvedBuildOptions.base : '/',
      MODE: mode,
      DEV: !isProduction,
      PROD: isProduction
    },
    assetsInclude(file: string) {
      return DEFAULT_ASSETS_RE.test(file) || assetsFilter(file)
    },
    logger: createLogger(config.logLevel)
  }

  resolved.plugins = await resolvePlugins(
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

export function mergeConfig(
  a: Record<string, any>,
  b: Record<string, any>,
  isRoot = true
): Record<string, any> {
  const merged: Record<string, any> = { ...a }
  for (const key in b) {
    const value = b[key]
    if (value == null) {
      continue
    }

    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value)) {
      merged[key] = [...existing, ...value]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfig(existing, value, false)
      continue
    }

    // root fields that require special handling
    if (existing != null && isRoot) {
      if (key === 'alias') {
        merged[key] = mergeAlias(existing, value)
        continue
      } else if (key === 'assetsInclude') {
        merged[key] = [].concat(existing, value)
        continue
      }
    }

    merged[key] = value
  }
  return merged
}

function mergeAlias(a: AliasOptions = [], b: AliasOptions = []): Alias[] {
  return [...normalizeAlias(a), ...normalizeAlias(b)]
}

function normalizeAlias(o: AliasOptions): Alias[] {
  return Array.isArray(o)
    ? o.map(normalizeSingleAlias)
    : Object.keys(o).map((find) =>
        normalizeSingleAlias({
          find,
          replacement: (o as any)[find]
        })
      )
}

// https://github.com/vitejs/vite/issues/1363
// work around https://github.com/rollup/plugins/issues/759
function normalizeSingleAlias({ find, replacement }: Alias): Alias {
  if (
    typeof find === 'string' &&
    find.endsWith('/') &&
    replacement.endsWith('/')
  ) {
    find = find.slice(0, find.length - 1)
    replacement = replacement.slice(0, replacement.length - 1)
  }
  return { find, replacement }
}

export function sortUserPlugins(
  plugins: (Plugin | Plugin[])[] | undefined
): [Plugin[], Plugin[], Plugin[]] {
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

  return [prePlugins, postPlugins, normalPlugins]
}

export async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configFile?: string,
  configRoot: string = process.cwd(),
  logLevel?: LogLevel
): Promise<{ path: string; config: UserConfig } | null> {
  const start = Date.now()

  let resolvedPath: string | undefined
  let isTS = false
  let isMjs = false

  function checkMjs() {
    // check package.json for type: "module" and set `isMjs` to true
    try {
      const pkg = lookupFile(configRoot, ['package.json'])
      if (pkg && JSON.parse(pkg).type === 'module') {
        isMjs = true
      }
    } catch (e) {}
  }

  if (configFile) {
    // explicit config path is always resolved from cwd
    resolvedPath = path.resolve(configFile)
    if (configFile.endsWith('.js')) checkMjs()
  } else {
    // implicit config file loaded from inline root (if present)
    // otherwise from cwd
    const jsconfigFile = path.resolve(configRoot, 'vite.config.js')
    if (fs.existsSync(jsconfigFile)) {
      resolvedPath = jsconfigFile
      checkMjs()
    }

    if (!resolvedPath) {
      const mjsconfigFile = path.resolve(configRoot, 'vite.config.mjs')
      if (fs.existsSync(mjsconfigFile)) {
        resolvedPath = mjsconfigFile
        isMjs = true
      }
    }

    if (!resolvedPath) {
      const tsconfigFile = path.resolve(configRoot, 'vite.config.ts')
      if (fs.existsSync(tsconfigFile)) {
        resolvedPath = tsconfigFile
        isTS = true
      }
    }
  }

  if (!resolvedPath) {
    debug('no config file found.')
    return null
  }

  try {
    let userConfig: UserConfigExport | undefined

    if (isMjs) {
      // using eval to avoid this from being compiled away by TS/Rollup
      // append a query so that we force reload fresh config in case of
      // server restart
      userConfig = (await eval(`import(resolvedPath + '?t=${Date.now()}')`))
        .default
      debug(`native esm config loaded in ${Date.now() - start}ms`)
    }

    if (!userConfig && !isTS && !isMjs) {
      // 1. try to directly require the module (assuming commonjs)
      try {
        // clear cache in case of server restart
        delete require.cache[resolvedPath]
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
          resolvePlugin({
            root: path.dirname(resolvedPath),
            isBuild: true,
            asSrc: false
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
      debug(`bundled config file loaded in ${Date.now() - start}ms`)
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
      chalk.red(`failed to load config from ${resolvedPath}`)
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

export function loadEnv(mode: string, root: string, prefix = 'VITE_') {
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

  // check if there are actual env variables starting with VITE_*
  // these are typically provided inline and should be prioritized
  for (const key in process.env) {
    if (key.startsWith(prefix) && env[key] === undefined) {
      env[key] = process.env[key] as string
    }
  }

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
