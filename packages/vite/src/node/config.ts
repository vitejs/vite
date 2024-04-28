import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
import colors from 'picocolors'
import type { Alias, AliasOptions } from 'dep-types/alias'
import aliasPlugin from '@rollup/plugin-alias'
import { build } from 'esbuild'
import type { PartialResolvedId, RollupOptions } from 'rollup'
import { withTrailingSlash } from '../shared/utils'
import {
  CLIENT_ENTRY,
  DEFAULT_ASSETS_RE,
  DEFAULT_CONFIG_FILES,
  DEFAULT_EXTENSIONS,
  DEFAULT_MAIN_FIELDS,
  ENV_ENTRY,
  FS_PREFIX,
} from './constants'
import type {
  HookHandler,
  Plugin,
  PluginEnvironment,
  PluginOption,
  PluginWithRequiredHook,
} from './plugin'
import type {
  BuildEnvironmentOptions,
  BuildOptions,
  BuilderOptions,
  RenderBuiltAssetUrl,
  ResolvedBuildEnvironmentOptions,
  ResolvedBuildOptions,
  ResolvedBuilderOptions,
} from './build'
import {
  resolveBuildEnvironmentOptions,
  resolveBuildOptions,
  resolveBuilderOptions,
} from './build'
import type { ResolvedServerOptions, ServerOptions } from './server'
import { resolveServerOptions } from './server'
import { Environment } from './environment'
import type { DevEnvironment } from './server/environment'
import type { PreviewOptions, ResolvedPreviewOptions } from './preview'
import { resolvePreviewOptions } from './preview'
import {
  type CSSOptions,
  type ResolvedCSSOptions,
  resolveCSSOptions,
} from './plugins/css'
import {
  asyncFlatten,
  createDebugger,
  createFilter,
  isBuiltin,
  isExternalUrl,
  isFilePathESM,
  isInNodeModules,
  isNodeBuiltin,
  isObject,
  isParentDirectory,
  mergeAlias,
  mergeConfig,
  normalizeAlias,
  normalizePath,
} from './utils'
import { getFsUtils } from './fsUtils'
import {
  createPluginHookUtils,
  getHookHandler,
  getSortedPluginsByHook,
  resolvePlugins,
} from './plugins'
import type { ESBuildOptions } from './plugins/esbuild'
import type { InternalResolveOptions, ResolveOptions } from './plugins/resolve'
import { resolvePlugin, tryNodeResolve } from './plugins/resolve'
import type { LogLevel, Logger } from './logger'
import { createLogger } from './logger'
import type { DepOptimizationConfig, DepOptimizationOptions } from './optimizer'
import type { JsonOptions } from './plugins/json'
import type { BoundedPluginContainer } from './server/pluginContainer'
import { createBoundedPluginContainer } from './server/pluginContainer'
import type { PackageCache } from './packages'
import { findNearestPackageData } from './packages'
import { loadEnv, resolveEnvPrefix } from './env'
import type { ResolvedSSROptions, SSROptions } from './ssr'
import { resolveSSROptions } from './ssr'

const debug = createDebugger('vite:config')
const promisifiedRealpath = promisify(fs.realpath)

export interface ConfigEnv {
  /**
   * 'serve': during dev (`vite` command)
   * 'build': when building for production (`vite build` command)
   */
  command: 'build' | 'serve'
  mode: string
  isSsrBuild?: boolean
  isPreview?: boolean
}

/**
 * spa: include SPA fallback middleware and configure sirv with `single: true` in preview
 *
 * mpa: only include non-SPA HTML middlewares
 *
 * custom: don't include HTML middlewares
 */
export type AppType = 'spa' | 'mpa' | 'custom'

export type UserConfigFnObject = (env: ConfigEnv) => UserConfig
export type UserConfigFnPromise = (env: ConfigEnv) => Promise<UserConfig>
export type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>

export type UserConfigExport =
  | UserConfig
  | Promise<UserConfig>
  | UserConfigFnObject
  | UserConfigFnPromise
  | UserConfigFn

/**
 * Type helper to make it easier to use vite.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object.
 */
export function defineConfig(config: UserConfig): UserConfig
export function defineConfig(config: Promise<UserConfig>): Promise<UserConfig>
export function defineConfig(config: UserConfigFnObject): UserConfigFnObject
export function defineConfig(config: UserConfigExport): UserConfigExport
export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}

export interface DevEnvironmentOptions {
  /**
   * Files tßo be pre-transformed. Supports glob patterns.
   */
  warmup?: string[]
  /**
   * Pre-transform known direct imports
   * defaults to true for the client environment, false for the rest
   */
  preTransformRequests?: boolean
  /**
   * Enables sourcemaps during dev
   * @default { js: true }
   * @experimental
   */
  sourcemap?: boolean | { js?: boolean; css?: boolean }
  /**
   * Whether or not to ignore-list source files in the dev server sourcemap, used to populate
   * the [`x_google_ignoreList` source map extension](https://developer.chrome.com/blog/devtools-better-angular-debugging/#the-x_google_ignorelist-source-map-extension).
   *
   * By default, it excludes all paths containing `node_modules`. You can pass `false` to
   * disable this behavior, or, for full control, a function that takes the source path and
   * sourcemap path and returns whether to ignore the source path.
   */
  sourcemapIgnoreList?:
    | false
    | ((sourcePath: string, sourcemapPath: string) => boolean)

  /**
   * Optimize deps config
   */
  optimizeDeps?: DepOptimizationConfig

  /**
   * create the Dev Environment instance
   */
  createEnvironment?: (
    name: string,
    config: ResolvedConfig,
  ) => Promise<DevEnvironment> | DevEnvironment

  /**
   * For environments that support a full-reload, like the client, we can short-circuit when
   * restarting the server throwing early to stop processing current files. We avoided this for
   * SSR requests. Maybe this is no longer needed.
   * @experimental
   */
  recoverable?: boolean

  /**
   * For environments associated with a module runner.
   * By default it is true for the client environment and false for non-client environments.
   * This option can also be used instead of the removed config.experimental.skipSsrTransform.
   */
  moduleRunnerTransform?: boolean

  /**
   * Defaults to true for the client environment and false for others, following node permissive
   * security model.
   * TODO: We need to move at least server.fs.strict to dev options because we want to restrict
   * fs access from the client, but keep it open for SSR running on node. For now, we moved
   * the check to use environment.nodeCompatible
   * Should we only have a boolean toggle per environment and a keep allow/deny configuration
   * in server.fs, or move the whole configuration to the environment?
   */
  // fs: { strict?: boolean, allow, deny }
}

export type ResolvedDevEnvironmentOptions = Required<
  Omit<DevEnvironmentOptions, 'createEnvironment'>
> & {
  // TODO: Should we set the default at config time? For now, it is defined on server init
  createEnvironment:
    | ((
        name: string,
        config: ResolvedConfig,
      ) => Promise<DevEnvironment> | DevEnvironment)
    | undefined
}

type EnvironmentResolveOptions = ResolveOptions & {
  alias?: AliasOptions
}

export interface SharedEnvironmentOptions {
  /**
   * Configure resolver
   */
  resolve?: EnvironmentResolveOptions
  /**
   * Runtime Compatibility
   * Temporal options, we should remove these in favor of fine-grained control
   */
  nodeCompatible?: boolean
  webCompatible?: boolean // was ssr.target === 'webworker'
  /**
   * Should Vite inject timestamp if module is invalidated
   * Disabling this will break built-in HMR support
   * @experimental
   * @default true
   */
  injectInvalidationTimestamp?: boolean
}

export interface EnvironmentOptions extends SharedEnvironmentOptions {
  /**
   * Dev specific options
   */
  dev?: DevEnvironmentOptions
  /**
   * Build specific options
   */
  build?: BuildEnvironmentOptions
}

export type ResolvedEnvironmentResolveOptions =
  Required<EnvironmentResolveOptions>

export type ResolvedEnvironmentOptions = {
  resolve: ResolvedEnvironmentResolveOptions
  nodeCompatible: boolean
  webCompatible: boolean
  injectInvalidationTimestamp: boolean
  dev: ResolvedDevEnvironmentOptions
  build: ResolvedBuildEnvironmentOptions
}

export type DefaultEnvironmentOptions = Omit<
  EnvironmentOptions,
  'build' | 'nodeCompatible' | 'webCompatible'
> & {
  // Includes lib mode support
  build?: BuildOptions
}

export interface UserConfig extends DefaultEnvironmentOptions {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  /**
   * Base public path when served in development or production.
   * @default '/'
   */
  base?: string
  /**
   * Directory to serve as plain static assets. Files in this directory are
   * served and copied to build dist dir as-is without transform. The value
   * can be either an absolute file system path or a path relative to project root.
   *
   * Set to `false` or an empty string to disable copied static assets to build dist dir.
   * @default 'public'
   */
  publicDir?: string | false
  /**
   * Directory to save cache files. Files in this directory are pre-bundled
   * deps or some other cache files that generated by vite, which can improve
   * the performance. You can use `--force` flag or manually delete the directory
   * to regenerate the cache files. The value can be either an absolute file
   * system path or a path relative to project root.
   * Default to `.vite` when no `package.json` is detected.
   * @default 'node_modules/.vite'
   */
  cacheDir?: string
  /**
   * Explicitly set a mode to run in. This will override the default mode for
   * each command, and can be overridden by the command line --mode option.
   */
  mode?: string
  /**
   * Define global variable replacements.
   * Entries will be defined on `window` during dev and replaced during build.
   */
  define?: Record<string, any>
  /**
   * Array of vite plugins to use.
   */
  plugins?: PluginOption[]
  /**
   * HTML related options
   */
  html?: HTMLOptions
  /**
   * CSS related options (preprocessors and CSS modules)
   */
  css?: CSSOptions
  /**
   * JSON loading options
   */
  json?: JsonOptions
  /**
   * Transform options to pass to esbuild.
   * Or set to `false` to disable esbuild.
   */
  esbuild?: ESBuildOptions | false
  /**
   * Specify additional picomatch patterns to be treated as static assets.
   */
  assetsInclude?: string | RegExp | (string | RegExp)[]
  /**
   * Builder specific options
   */
  builder?: BuilderOptions
  /**
   * Server specific options, e.g. host, port, https...
   */
  server?: ServerOptions
  /**
   * Preview specific options, e.g. host, port, https...
   */
  preview?: PreviewOptions
  /**
   * Experimental features
   *
   * Features under this field could change in the future and might NOT follow semver.
   * Please be careful and always pin Vite's version when using them.
   * @experimental
   */
  experimental?: ExperimentalOptions
  /**
   * Legacy options
   *
   * Features under this field only follow semver for patches, they could be removed in a
   * future minor version. Please always pin Vite's version to a minor when using them.
   */
  legacy?: LegacyOptions
  /**
   * Log level.
   * @default 'info'
   */
  logLevel?: LogLevel
  /**
   * Custom logger.
   */
  customLogger?: Logger
  /**
   * @default true
   */
  clearScreen?: boolean
  /**
   * Environment files directory. Can be an absolute path, or a path relative from
   * root.
   * @default root
   */
  envDir?: string
  /**
   * Env variables starts with `envPrefix` will be exposed to your client source code via import.meta.env.
   * @default 'VITE_'
   */
  envPrefix?: string | string[]
  /**
   * Worker bundle options
   */
  worker?: {
    /**
     * Output format for worker bundle
     * @default 'iife'
     */
    format?: 'es' | 'iife'
    /**
     * Vite plugins that apply to worker bundle. The plugins returned by this function
     * should be new instances every time it is called, because they are used for each
     * rollup worker bundling process.
     */
    plugins?: () => PluginOption[]
    /**
     * Rollup options to build worker bundle
     */
    rollupOptions?: Omit<
      RollupOptions,
      'plugins' | 'input' | 'onwarn' | 'preserveEntrySignatures'
    >
  }
  /**
   * Dep optimization options
   */
  optimizeDeps?: DepOptimizationOptions
  /**
   * SSR specific options
   * We could make SSROptions be a EnvironmentOptions if we can abstract
   * external/noExternal for environments in general.
   */
  ssr?: SSROptions
  /**
   * Environment overrides
   */
  environments?: Record<string, EnvironmentOptions>
  /**
   * Whether your application is a Single Page Application (SPA),
   * a Multi-Page Application (MPA), or Custom Application (SSR
   * and frameworks with custom HTML handling)
   * @default 'spa'
   */
  appType?: AppType
}

export interface HTMLOptions {
  /**
   * A nonce value placeholder that will be used when generating script/style tags.
   *
   * Make sure that this placeholder will be replaced with a unique value for each request by the server.
   */
  cspNonce?: string
}

export interface ExperimentalOptions {
  /**
   * Append fake `&lang.(ext)` when queries are specified, to preserve the file extension for following plugins to process.
   *
   * @experimental
   * @default false
   */
  importGlobRestoreExtension?: boolean
  /**
   * Allow finegrain control over assets and public files paths
   *
   * @experimental
   */
  renderBuiltUrl?: RenderBuiltAssetUrl
  /**
   * Enables support of HMR partial accept via `import.meta.hot.acceptExports`.
   *
   * @experimental
   * @default false
   */
  hmrPartialAccept?: boolean
  /**
   * Skips SSR transform to make it easier to use Vite with Node ESM loaders.
   * @warning Enabling this will break normal operation of Vite's SSR in development mode.
   *
   * @experimental
   * @default false
   */
  skipSsrTransform?: boolean
}

export interface LegacyOptions {
  /**
   * In Vite 4, SSR-externalized modules (modules not bundled and loaded by Node.js at runtime)
   * are implicitly proxied in dev to automatically handle `default` and `__esModule` access.
   * However, this does not correctly reflect how it works in the Node.js runtime, causing
   * inconsistencies between dev and prod.
   *
   * In Vite 5, the proxy is removed so dev and prod are consistent, but if you still require
   * the old behaviour, you can enable this option. If so, please leave your feedback at
   * https://github.com/vitejs/vite/discussions/14697.
   */
  proxySsrExternalModules?: boolean
}

export interface ResolvedWorkerOptions {
  format: 'es' | 'iife'
  plugins: (bundleChain: string[]) => Promise<Plugin[]>
  rollupOptions: RollupOptions
}

export interface InlineConfig extends UserConfig {
  configFile?: string | false
  envFile?: false
}

export type ResolvedConfig = Readonly<
  Omit<
    UserConfig,
    | 'plugins'
    | 'css'
    | 'assetsInclude'
    | 'optimizeDeps'
    | 'worker'
    | 'build'
    | 'dev'
    | 'environments'
  > & {
    configFile: string | undefined
    configFileDependencies: string[]
    inlineConfig: InlineConfig
    root: string
    base: string
    /** @internal */
    rawBase: string
    publicDir: string
    cacheDir: string
    command: 'build' | 'serve'
    mode: string
    isWorker: boolean
    // in nested worker bundle to find the main config
    /** @internal */
    mainConfig: ResolvedConfig | null
    /** @internal list of bundle entry id. used to detect recursive worker bundle. */
    bundleChain: string[]
    isProduction: boolean
    envDir: string
    env: Record<string, any>
    resolve: Required<ResolveOptions> & {
      alias: Alias[]
    }
    plugins: readonly Plugin[]
    css: ResolvedCSSOptions
    esbuild: ESBuildOptions | false
    server: ResolvedServerOptions
    dev: ResolvedDevEnvironmentOptions
    builder: ResolvedBuilderOptions
    build: ResolvedBuildOptions
    preview: ResolvedPreviewOptions
    ssr: ResolvedSSROptions
    assetsInclude: (file: string) => boolean
    logger: Logger
    createResolver: (options?: Partial<InternalResolveOptions>) => ResolveFn
    optimizeDeps: DepOptimizationOptions
    /** @internal */
    packageCache: PackageCache
    worker: ResolvedWorkerOptions
    appType: AppType
    experimental: ExperimentalOptions
    environments: Record<string, ResolvedEnvironmentOptions>
  } & PluginHookUtils
>

export function resolveDevEnvironmentOptions(
  dev: DevEnvironmentOptions | undefined,
  preserverSymlinks: boolean,
  environmentName: string | undefined,
  // Backward compatibility
  skipSsrTransform?: boolean,
): ResolvedDevEnvironmentOptions {
  return {
    sourcemap: dev?.sourcemap ?? { js: true },
    sourcemapIgnoreList:
      dev?.sourcemapIgnoreList === false
        ? () => false
        : dev?.sourcemapIgnoreList || isInNodeModules,
    preTransformRequests:
      dev?.preTransformRequests ?? environmentName === 'client',
    warmup: dev?.warmup ?? [],
    optimizeDeps: resolveOptimizeDepsConfig(
      dev?.optimizeDeps,
      preserverSymlinks,
    ),
    createEnvironment: dev?.createEnvironment,
    recoverable: dev?.recoverable ?? environmentName === 'client',
    moduleRunnerTransform:
      dev?.moduleRunnerTransform ??
      (skipSsrTransform !== undefined && environmentName === 'ssr'
        ? skipSsrTransform
        : environmentName !== 'client'),
  }
}

function resolveEnvironmentOptions(
  options: EnvironmentOptions,
  resolvedRoot: string,
  logger: Logger,
  environmentName: string,
  // Backward compatibility
  skipSsrTransform?: boolean,
): ResolvedEnvironmentOptions {
  const resolve = resolveEnvironmentResolveOptions(options.resolve, logger)
  return {
    resolve,
    nodeCompatible: options.nodeCompatible ?? environmentName !== 'client',
    webCompatible: options.webCompatible ?? environmentName === 'client',
    injectInvalidationTimestamp: options.injectInvalidationTimestamp ?? true,
    dev: resolveDevEnvironmentOptions(
      options.dev,
      resolve.preserveSymlinks,
      environmentName,
      skipSsrTransform,
    ),
    build: resolveBuildEnvironmentOptions(
      options.build ?? {},
      logger,
      resolvedRoot,
      environmentName,
    ),
  }
}

export function getDefaultEnvironmentOptions(
  config: UserConfig,
): EnvironmentOptions {
  return {
    resolve: config.resolve,
    dev: config.dev,
    build: config.build,
  }
}

export function getDefaultResolvedEnvironmentOptions(
  config: ResolvedConfig,
): ResolvedEnvironmentOptions {
  return {
    resolve: config.resolve,
    nodeCompatible: true,
    webCompatible: false,
    injectInvalidationTimestamp: true,
    dev: config.dev,
    build: config.build,
  }
}

export interface PluginHookUtils {
  getSortedPlugins: <K extends keyof Plugin>(
    hookName: K,
  ) => PluginWithRequiredHook<K>[]
  getSortedPluginHooks: <K extends keyof Plugin>(
    hookName: K,
  ) => NonNullable<HookHandler<Plugin[K]>>[]
}

export type ResolveFn = (
  id: string,
  importer?: string,
  aliasOnly?: boolean,
  ssr?: boolean,
) => Promise<string | undefined>

/**
 * Check and warn if `path` includes characters that don't work well in Vite,
 * such as `#` and `?`.
 */
function checkBadCharactersInPath(path: string, logger: Logger): void {
  const badChars = []

  if (path.includes('#')) {
    badChars.push('#')
  }
  if (path.includes('?')) {
    badChars.push('?')
  }

  if (badChars.length > 0) {
    const charString = badChars.map((c) => `"${c}"`).join(' and ')
    const inflectedChars = badChars.length > 1 ? 'characters' : 'character'

    logger.warn(
      colors.yellow(
        `The project root contains the ${charString} ${inflectedChars} (${colors.cyan(
          path,
        )}), which may not work when running Vite. Consider renaming the directory to remove the characters.`,
      ),
    )
  }
}

const clientAlias = [
  {
    find: /^\/?@vite\/env/,
    replacement: path.posix.join(FS_PREFIX, normalizePath(ENV_ENTRY)),
  },
  {
    find: /^\/?@vite\/client/,
    replacement: path.posix.join(FS_PREFIX, normalizePath(CLIENT_ENTRY)),
  },
]

function resolveEnvironmentResolveOptions(
  resolve: EnvironmentResolveOptions | undefined,
  logger: Logger,
): ResolvedConfig['resolve'] {
  // resolve alias with internal client alias
  const resolvedAlias = normalizeAlias(
    mergeAlias(clientAlias, resolve?.alias || []),
  )

  const resolvedResolve: ResolvedConfig['resolve'] = {
    mainFields: resolve?.mainFields ?? DEFAULT_MAIN_FIELDS,
    conditions: resolve?.conditions ?? [],
    externalConditions: resolve?.externalConditions ?? [],
    external: resolve?.external ?? [],
    noExternal: resolve?.noExternal ?? [],
    extensions: resolve?.extensions ?? DEFAULT_EXTENSIONS,
    dedupe: resolve?.dedupe ?? [],
    preserveSymlinks: resolve?.preserveSymlinks ?? false,
    alias: resolvedAlias,
  }

  if (
    // @ts-expect-error removed field
    resolve?.browserField === false &&
    resolvedResolve.mainFields.includes('browser')
  ) {
    logger.warn(
      colors.yellow(
        `\`resolve.browserField\` is set to false, but the option is removed in favour of ` +
          `the 'browser' string in \`resolve.mainFields\`. You may want to update \`resolve.mainFields\` ` +
          `to remove the 'browser' string and preserve the previous browser behaviour.`,
      ),
    )
  }
  return resolvedResolve
}

// TODO: Introduce ResolvedDepOptimizationConfig
function resolveOptimizeDepsConfig(
  optimizeDeps: DepOptimizationConfig | undefined,
  preserveSymlinks: boolean,
): DepOptimizationConfig {
  optimizeDeps ??= {}
  return {
    include: optimizeDeps.include ?? [],
    exclude: optimizeDeps.exclude ?? [],
    needsInterop: optimizeDeps.needsInterop ?? [],
    extensions: optimizeDeps.extensions ?? [],
    noDiscovery: optimizeDeps.noDiscovery ?? false,
    holdUntilCrawlEnd: optimizeDeps.holdUntilCrawlEnd ?? true,
    esbuildOptions: {
      preserveSymlinks, // TODO: ?
      ...optimizeDeps.esbuildOptions,
    },
    disabled: optimizeDeps.disabled,
  }
}

export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode = 'development',
  defaultNodeEnv = 'development',
  isPreview = false,
  patchConfig: ((config: ResolvedConfig) => void) | undefined = undefined,
  patchPlugins: ((plugins: Plugin[]) => void) | undefined = undefined,
): Promise<ResolvedConfig> {
  let config = inlineConfig
  let configFileDependencies: string[] = []
  let mode = inlineConfig.mode || defaultMode
  const isNodeEnvSet = !!process.env.NODE_ENV
  const packageCache: PackageCache = new Map()

  // some dependencies e.g. @vue/compiler-* relies on NODE_ENV for getting
  // production-specific behavior, so set it early on
  if (!isNodeEnvSet) {
    process.env.NODE_ENV = defaultNodeEnv
  }

  const configEnv: ConfigEnv = {
    mode,
    command,
    isSsrBuild: command === 'build' && !!config.build?.ssr,
    isPreview,
  }

  let { configFile } = config
  if (configFile !== false) {
    const loadResult = await loadConfigFromFile(
      configEnv,
      configFile,
      config.root,
      config.logLevel,
      config.customLogger,
    )
    if (loadResult) {
      config = mergeConfig(loadResult.config, config)
      configFile = loadResult.path
      configFileDependencies = loadResult.dependencies
    }
  }

  // user config may provide an alternative mode. But --mode has a higher priority
  mode = inlineConfig.mode || config.mode || mode
  configEnv.mode = mode

  const filterPlugin = (p: Plugin) => {
    if (!p) {
      return false
    } else if (!p.apply) {
      return true
    } else if (typeof p.apply === 'function') {
      return p.apply({ ...config, mode }, configEnv)
    } else {
      return p.apply === command
    }
  }

  // resolve plugins
  const rawUserPlugins = (
    (await asyncFlatten(config.plugins || [])) as Plugin[]
  ).filter(filterPlugin)

  const [prePlugins, normalPlugins, postPlugins] =
    sortUserPlugins(rawUserPlugins)

  const isBuild = command === 'build'

  // Ensure default client and ssr environments
  // If there are present, ensure order { client, ssr, ...custom }
  config.environments ??= {}
  if (
    !config.environments.ssr &&
    (!isBuild || config.ssr || config.build?.ssr)
  ) {
    // During dev, the ssr environment is always available even if it isn't configure
    // There is no perf hit, because the optimizer is initialized only if ssrLoadModule
    // is called.
    // During build, we only build the ssr environment if it is configured
    // through the deprecated ssr top level options or if it is explicitely defined
    // in the environments config
    config.environments = { ssr: {}, ...config.environments }
  }
  if (!config.environments.client) {
    config.environments = { client: {}, ...config.environments }
  }

  // run config hooks
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins]
  config = await runConfigHook(config, userPlugins, configEnv)

  // Define logger
  const logger = createLogger(config.logLevel, {
    allowClearScreen: config.clearScreen,
    customLogger: config.customLogger,
  })

  // resolve root
  const resolvedRoot = normalizePath(
    config.root ? path.resolve(config.root) : process.cwd(),
  )

  checkBadCharactersInPath(resolvedRoot, logger)

  // Backward compatibility: merge optimizeDeps into environments.client.dev.optimizeDeps as defaults
  // TODO: should entries and force be in EnvironmentOptions?
  const { entries, force, ...deprecatedClientOptimizeDepsConfig } =
    config.optimizeDeps ?? {}
  const configEnvironmentsClient = config.environments!.client!
  configEnvironmentsClient.dev ??= {}
  configEnvironmentsClient.dev.optimizeDeps = mergeConfig(
    deprecatedClientOptimizeDepsConfig,
    configEnvironmentsClient.dev.optimizeDeps ?? {},
  )

  const deprecatedSsrOptimizeDepsConfig = config.ssr?.optimizeDeps ?? {}
  let configEnvironmentsSsr = config.environments!.ssr

  // Backward compatibility: server.warmup.clientFiles/ssrFiles -> environment.dev.warmup
  const warmupOptions = config.server?.warmup
  if (warmupOptions?.clientFiles) {
    configEnvironmentsClient.dev.warmup = warmupOptions?.clientFiles
  }
  if (warmupOptions?.ssrFiles) {
    configEnvironmentsSsr ??= {}
    configEnvironmentsSsr.dev ??= {}
    configEnvironmentsSsr.dev.warmup = warmupOptions?.ssrFiles
  }

  // Backward compatibility: merge ssr into environments.ssr.config as defaults
  if (configEnvironmentsSsr) {
    configEnvironmentsSsr.dev ??= {}
    configEnvironmentsSsr.dev.optimizeDeps = mergeConfig(
      deprecatedSsrOptimizeDepsConfig,
      configEnvironmentsSsr.dev.optimizeDeps ?? {},
    )
    // TODO: should we merge here?
    configEnvironmentsSsr.resolve ??= {}
    configEnvironmentsSsr.resolve.conditions ??= config.ssr?.resolve?.conditions
    configEnvironmentsSsr.resolve.externalConditions ??=
      config.ssr?.resolve?.externalConditions
    configEnvironmentsSsr.resolve.external ??= config.ssr?.external
    configEnvironmentsSsr.resolve.noExternal ??= config.ssr?.noExternal

    if (config.ssr?.target === 'webworker') {
      configEnvironmentsSsr.webCompatible = true
    }
  }

  if (config.build?.ssrEmitAssets !== undefined) {
    configEnvironmentsSsr ??= {}
    configEnvironmentsSsr.build ??= {}
    configEnvironmentsSsr.build.emitAssets = config.build.ssrEmitAssets
  }

  // The client and ssr environment configs can't be removed by the user in the config hook
  if (
    !config.environments ||
    !config.environments.client ||
    (!config.environments.ssr && !isBuild)
  ) {
    throw new Error(
      'Required environments configuration were stripped out in the config hook',
    )
  }

  // Merge default environment config values
  const defaultEnvironmentOptions = getDefaultEnvironmentOptions(config)
  for (const name of Object.keys(config.environments)) {
    config.environments[name] = mergeConfig(
      defaultEnvironmentOptions,
      config.environments[name],
    )
  }

  await runConfigEnvironmentHook(config.environments, userPlugins, configEnv)

  const resolvedEnvironments: Record<string, ResolvedEnvironmentOptions> = {}
  for (const name of Object.keys(config.environments)) {
    resolvedEnvironments[name] = resolveEnvironmentOptions(
      config.environments[name],
      resolvedRoot,
      logger,
      name,
      config.experimental?.skipSsrTransform,
    )
  }

  const resolvedDefaultEnvironmentResolve = resolveEnvironmentResolveOptions(
    config.resolve,
    logger,
  )

  // Backward compatibility: merge environments.client.dev.optimizeDeps back into optimizeDeps
  const resolvedConfigEnvironmentsClient = resolvedEnvironments.client
  const patchedOptimizeDeps = mergeConfig(
    config.optimizeDeps ?? {},
    resolvedConfigEnvironmentsClient.dev?.optimizeDeps ?? {},
  )
  const backwardCompatibleOptimizeDeps = {
    holdUntilCrawlEnd: true,
    ...patchedOptimizeDeps,
    esbuildOptions: {
      preserveSymlinks: resolvedDefaultEnvironmentResolve.preserveSymlinks,
      ...patchedOptimizeDeps.esbuildOptions,
    },
  }

  // TODO: Deprecate and remove resolve, dev and build options at the root level of the resolved config

  const resolvedDevEnvironmentOptions = resolveDevEnvironmentOptions(
    config.dev,
    resolvedDefaultEnvironmentResolve.preserveSymlinks,
    undefined, // default environment
  )

  const resolvedBuildOptions = resolveBuildOptions(
    config.build ?? {},
    logger,
    resolvedRoot,
  )

  // Backward compatibility: merge config.environments.ssr back into config.ssr
  // so ecosystem SSR plugins continue to work if only environments.ssr is configured
  const patchedConfigSsr = {
    ...config.ssr,
    external: resolvedEnvironments.ssr?.resolve.external,
    noExternal: resolvedEnvironments.ssr?.resolve.noExternal,
    optimizeDeps: mergeConfig(
      config.ssr?.optimizeDeps ?? {},
      resolvedEnvironments.ssr?.dev?.optimizeDeps ?? {},
    ),
    resolve: {
      ...config.ssr?.resolve,
      conditions: resolvedEnvironments.ssr?.resolve.conditions,
      externalConditions: resolvedEnvironments.ssr?.resolve.externalConditions,
    },
  }
  const ssr = resolveSSROptions(
    patchedConfigSsr,
    resolvedDefaultEnvironmentResolve.preserveSymlinks,
  )

  // load .env files
  const envDir = config.envDir
    ? normalizePath(path.resolve(resolvedRoot, config.envDir))
    : resolvedRoot
  const userEnv =
    inlineConfig.envFile !== false &&
    loadEnv(mode, envDir, resolveEnvPrefix(config))

  // Note it is possible for user to have a custom mode, e.g. `staging` where
  // development-like behavior is expected. This is indicated by NODE_ENV=development
  // loaded from `.staging.env` and set by us as VITE_USER_NODE_ENV
  const userNodeEnv = process.env.VITE_USER_NODE_ENV
  if (!isNodeEnvSet && userNodeEnv) {
    if (userNodeEnv === 'development') {
      process.env.NODE_ENV = 'development'
    } else {
      // NODE_ENV=production is not supported as it could break HMR in dev for frameworks like Vue
      logger.warn(
        `NODE_ENV=${userNodeEnv} is not supported in the .env file. ` +
          `Only NODE_ENV=development is supported to create a development build of your project. ` +
          `If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.`,
      )
    }
  }

  const isProduction = process.env.NODE_ENV === 'production'

  // resolve public base url
  const relativeBaseShortcut = config.base === '' || config.base === './'

  // During dev, we ignore relative base and fallback to '/'
  // For the SSR build, relative base isn't possible by means
  // of import.meta.url.
  const resolvedBase = relativeBaseShortcut
    ? !isBuild || config.build?.ssr
      ? '/'
      : './'
    : resolveBaseUrl(config.base, isBuild, logger) ?? '/'

  // resolve cache directory
  const pkgDir = findNearestPackageData(resolvedRoot, packageCache)?.dir
  const cacheDir = normalizePath(
    config.cacheDir
      ? path.resolve(resolvedRoot, config.cacheDir)
      : pkgDir
        ? path.join(pkgDir, `node_modules/.vite`)
        : path.join(resolvedRoot, `.vite`),
  )

  const assetsFilter =
    config.assetsInclude &&
    (!Array.isArray(config.assetsInclude) || config.assetsInclude.length)
      ? createFilter(config.assetsInclude)
      : () => false

  const { publicDir } = config
  const resolvedPublicDir =
    publicDir !== false && publicDir !== ''
      ? normalizePath(
          path.resolve(
            resolvedRoot,
            typeof publicDir === 'string' ? publicDir : 'public',
          ),
        )
      : ''

  const server = resolveServerOptions(resolvedRoot, config.server, logger)

  const builder = resolveBuilderOptions(config.builder)

  const BASE_URL = resolvedBase

  let resolved: ResolvedConfig

  let createUserWorkerPlugins = config.worker?.plugins
  if (Array.isArray(createUserWorkerPlugins)) {
    // @ts-expect-error backward compatibility
    createUserWorkerPlugins = () => config.worker?.plugins

    logger.warn(
      colors.yellow(
        `worker.plugins is now a function that returns an array of plugins. ` +
          `Please update your Vite config accordingly.\n`,
      ),
    )
  }

  const createWorkerPlugins = async function (bundleChain: string[]) {
    // Some plugins that aren't intended to work in the bundling of workers (doing post-processing at build time for example).
    // And Plugins may also have cached that could be corrupted by being used in these extra rollup calls.
    // So we need to separate the worker plugin from the plugin that vite needs to run.
    const rawWorkerUserPlugins = (
      (await asyncFlatten(createUserWorkerPlugins?.() || [])) as Plugin[]
    ).filter(filterPlugin)

    // resolve worker
    let workerConfig = mergeConfig({}, config)
    const [workerPrePlugins, workerNormalPlugins, workerPostPlugins] =
      sortUserPlugins(rawWorkerUserPlugins)

    // run config hooks
    const workerUserPlugins = [
      ...workerPrePlugins,
      ...workerNormalPlugins,
      ...workerPostPlugins,
    ]
    workerConfig = await runConfigHook(
      workerConfig,
      workerUserPlugins,
      configEnv,
    )

    const workerResolved: ResolvedConfig = {
      ...workerConfig,
      ...resolved,
      isWorker: true,
      mainConfig: resolved,
      bundleChain,
    }
    const resolvedWorkerPlugins = await resolvePlugins(
      workerResolved,
      workerPrePlugins,
      workerNormalPlugins,
      workerPostPlugins,
    )

    // run configResolved hooks
    await Promise.all(
      createPluginHookUtils(resolvedWorkerPlugins)
        .getSortedPluginHooks('configResolved')
        .map((hook) => hook(workerResolved)),
    )

    return resolvedWorkerPlugins
  }

  const resolvedWorkerOptions: ResolvedWorkerOptions = {
    format: config.worker?.format || 'iife',
    plugins: createWorkerPlugins,
    rollupOptions: config.worker?.rollupOptions || {},
  }

  resolved = {
    configFile: configFile ? normalizePath(configFile) : undefined,
    configFileDependencies: configFileDependencies.map((name) =>
      normalizePath(path.resolve(name)),
    ),
    inlineConfig,
    root: resolvedRoot,
    base: withTrailingSlash(resolvedBase),
    rawBase: resolvedBase,
    publicDir: resolvedPublicDir,
    cacheDir,
    command,
    mode,
    isWorker: false,
    mainConfig: null,
    bundleChain: [],
    isProduction,
    plugins: userPlugins,
    css: resolveCSSOptions(config.css),
    esbuild:
      config.esbuild === false
        ? false
        : {
            jsxDev: !isProduction,
            ...config.esbuild,
          },
    server,
    builder,
    preview: resolvePreviewOptions(config.preview, server),
    envDir,
    env: {
      ...userEnv,
      BASE_URL,
      MODE: mode,
      DEV: !isProduction,
      PROD: isProduction,
    },
    assetsInclude(file: string) {
      return DEFAULT_ASSETS_RE.test(file) || assetsFilter(file)
    },
    logger,
    packageCache,
    worker: resolvedWorkerOptions,
    appType: config.appType ?? 'spa',
    experimental: {
      importGlobRestoreExtension: false,
      hmrPartialAccept: false,
      ...config.experimental,
    },

    // Backward compatibility, users should use environment.config.dev.optimizeDeps
    optimizeDeps: backwardCompatibleOptimizeDeps,
    ssr,

    // TODO: deprecate and later remove from ResolvedConfig?
    resolve: resolvedDefaultEnvironmentResolve,
    dev: resolvedDevEnvironmentOptions,
    build: resolvedBuildOptions,

    environments: resolvedEnvironments,

    getSortedPlugins: undefined!,
    getSortedPluginHooks: undefined!,

    // createResolver is deprecated. It only works for the client and ssr
    // environments. The `aliasOnly` option is also not being used any more
    // Plugins should move to createIdResolver(environment) instead.
    // create an internal resolver to be used in special scenarios, e.g.
    // optimizer & handling css @imports
    createResolver(options) {
      const alias: {
        client?: BoundedPluginContainer
        ssr?: BoundedPluginContainer
      } = {}
      const resolver: {
        client?: BoundedPluginContainer
        ssr?: BoundedPluginContainer
      } = {}
      const environments = this.environments ?? resolvedEnvironments
      const createPluginContainer = async (
        environmentName: string,
        plugins: Plugin[],
      ) => {
        // The used alias and resolve plugins only use configuration options from the
        // environment so we can safely cast to a base Environment instance to a
        // PluginEnvironment here
        const environment = new Environment(environmentName, this)
        const pluginContainer = await createBoundedPluginContainer(
          environment as PluginEnvironment,
          plugins,
        )
        await pluginContainer.buildStart({})
        return pluginContainer
      }
      async function resolve(
        id: string,
        importer?: string,
        aliasOnly?: boolean,
        ssr?: boolean,
      ): Promise<PartialResolvedId | null> {
        const environmentName = ssr ? 'ssr' : 'client'
        let container: BoundedPluginContainer
        if (aliasOnly) {
          let aliasContainer = alias[environmentName]
          if (!aliasContainer) {
            aliasContainer = alias[environmentName] =
              await createPluginContainer(environmentName, [
                aliasPlugin({ entries: resolved.resolve.alias }),
              ])
          }
          container = aliasContainer
        } else {
          let resolverContainer = resolver[environmentName]
          if (!resolverContainer) {
            resolverContainer = resolver[environmentName] =
              await createPluginContainer(environmentName, [
                aliasPlugin({ entries: resolved.resolve.alias }),
                resolvePlugin(
                  {
                    ...resolved.resolve,
                    root: resolvedRoot,
                    isProduction,
                    isBuild: command === 'build',
                    asSrc: true,
                    preferRelative: false,
                    tryIndex: true,
                    ...options,
                    idOnly: true,
                    fsUtils: getFsUtils(resolved),
                  },
                  environments,
                ),
              ])
          }
          container = resolverContainer
        }
        return await container.resolveId(id, importer, { scan: options?.scan })
      }
      return async (id, importer, aliasOnly, ssr) =>
        (await resolve(id, importer, aliasOnly, ssr))?.id
    },
  }
  resolved = {
    ...config,
    ...resolved,
  }

  // Backward compatibility hook, modify the resolved config before it is used
  // to create inernal plugins. For example, `config.build.ssr`. Once we rework
  // internal plugins to use environment.options, we can remove the dual
  // patchConfig/patchPlugins and have a single patchConfig before configResolved
  // gets called
  patchConfig?.(resolved)

  const resolvedPlugins = await resolvePlugins(
    resolved,
    prePlugins,
    normalPlugins,
    postPlugins,
  )

  // Backward compatibility hook used in builder
  patchPlugins?.(resolvedPlugins)
  ;(resolved.plugins as Plugin[]) = resolvedPlugins

  Object.assign(resolved, createPluginHookUtils(resolved.plugins))

  // call configResolved hooks
  await Promise.all(
    resolved
      .getSortedPluginHooks('configResolved')
      .map((hook) => hook(resolved)),
  )

  optimizeDepsDisabledBackwardCompatibility(resolved, resolved.optimizeDeps)
  optimizeDepsDisabledBackwardCompatibility(
    resolved,
    resolved.ssr.optimizeDeps,
    'ssr.',
  )

  debug?.(`using resolved config: %O`, {
    ...resolved,
    plugins: resolved.plugins.map((p) => p.name),
    worker: {
      ...resolved.worker,
      plugins: `() => plugins`,
    },
  })

  // validate config

  // Check if all assetFileNames have the same reference.
  // If not, display a warn for user.
  const outputOption = config.build?.rollupOptions?.output ?? []
  // Use isArray to narrow its type to array
  if (Array.isArray(outputOption)) {
    const assetFileNamesList = outputOption.map(
      (output) => output.assetFileNames,
    )
    if (assetFileNamesList.length > 1) {
      const firstAssetFileNames = assetFileNamesList[0]
      const hasDifferentReference = assetFileNamesList.some(
        (assetFileNames) => assetFileNames !== firstAssetFileNames,
      )
      if (hasDifferentReference) {
        resolved.logger.warn(
          colors.yellow(`
assetFileNames isn't equal for every build.rollupOptions.output. A single pattern across all outputs is supported by Vite.
`),
        )
      }
    }
  }

  // Warn about removal of experimental features
  if (
    // @ts-expect-error Option removed
    config.legacy?.buildSsrCjsExternalHeuristics ||
    // @ts-expect-error Option removed
    config.ssr?.format === 'cjs'
  ) {
    resolved.logger.warn(
      colors.yellow(`
(!) Experimental legacy.buildSsrCjsExternalHeuristics and ssr.format were be removed in Vite 5.
    The only SSR Output format is ESM. Find more information at https://github.com/vitejs/vite/discussions/13816.
`),
    )
  }

  const resolvedBuildOutDir = normalizePath(
    path.resolve(resolved.root, resolved.build.outDir),
  )
  if (
    isParentDirectory(resolvedBuildOutDir, resolved.root) ||
    resolvedBuildOutDir === resolved.root
  ) {
    resolved.logger.warn(
      colors.yellow(`
(!) build.outDir must not be the same directory of root or a parent directory of root as this could cause Vite to overwriting source files with build outputs.
`),
    )
  }

  return resolved
}

/**
 * Resolve base url. Note that some users use Vite to build for non-web targets like
 * electron or expects to deploy
 */
export function resolveBaseUrl(
  base: UserConfig['base'] = '/',
  isBuild: boolean,
  logger: Logger,
): string {
  if (base[0] === '.') {
    logger.warn(
      colors.yellow(
        colors.bold(
          `(!) invalid "base" option: "${base}". The value can only be an absolute ` +
            `URL, "./", or an empty string.`,
        ),
      ),
    )
    return '/'
  }

  // external URL flag
  const isExternal = isExternalUrl(base)
  // no leading slash warn
  if (!isExternal && base[0] !== '/') {
    logger.warn(
      colors.yellow(
        colors.bold(`(!) "base" option should start with a slash.`),
      ),
    )
  }

  // parse base when command is serve or base is not External URL
  if (!isBuild || !isExternal) {
    base = new URL(base, 'http://vitejs.dev').pathname
    // ensure leading slash
    if (base[0] !== '/') {
      base = '/' + base
    }
  }

  return base
}

export function sortUserPlugins(
  plugins: (Plugin | Plugin[])[] | undefined,
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

  return [prePlugins, normalPlugins, postPlugins]
}

export async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configFile?: string,
  configRoot: string = process.cwd(),
  logLevel?: LogLevel,
  customLogger?: Logger,
): Promise<{
  path: string
  config: UserConfig
  dependencies: string[]
} | null> {
  const start = performance.now()
  const getTime = () => `${(performance.now() - start).toFixed(2)}ms`

  let resolvedPath: string | undefined

  if (configFile) {
    // explicit config path is always resolved from cwd
    resolvedPath = path.resolve(configFile)
  } else {
    // implicit config file loaded from inline root (if present)
    // otherwise from cwd
    for (const filename of DEFAULT_CONFIG_FILES) {
      const filePath = path.resolve(configRoot, filename)
      if (!fs.existsSync(filePath)) continue

      resolvedPath = filePath
      break
    }
  }

  if (!resolvedPath) {
    debug?.('no config file found.')
    return null
  }

  const isESM = isFilePathESM(resolvedPath)

  try {
    const bundled = await bundleConfigFile(resolvedPath, isESM)
    const userConfig = await loadConfigFromBundledFile(
      resolvedPath,
      bundled.code,
      isESM,
    )
    debug?.(`bundled config file loaded in ${getTime()}`)

    const config = await (typeof userConfig === 'function'
      ? userConfig(configEnv)
      : userConfig)
    if (!isObject(config)) {
      throw new Error(`config must export or return an object.`)
    }
    return {
      path: normalizePath(resolvedPath),
      config,
      dependencies: bundled.dependencies,
    }
  } catch (e) {
    createLogger(logLevel, { customLogger }).error(
      colors.red(`failed to load config from ${resolvedPath}`),
      {
        error: e,
      },
    )
    throw e
  }
}

async function bundleConfigFile(
  fileName: string,
  isESM: boolean,
): Promise<{ code: string; dependencies: string[] }> {
  const dirnameVarName = '__vite_injected_original_dirname'
  const filenameVarName = '__vite_injected_original_filename'
  const importMetaUrlVarName = '__vite_injected_original_import_meta_url'
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    write: false,
    target: ['node18'],
    platform: 'node',
    bundle: true,
    format: isESM ? 'esm' : 'cjs',
    mainFields: ['main'],
    sourcemap: 'inline',
    metafile: true,
    define: {
      __dirname: dirnameVarName,
      __filename: filenameVarName,
      'import.meta.url': importMetaUrlVarName,
      'import.meta.dirname': dirnameVarName,
      'import.meta.filename': filenameVarName,
    },
    plugins: [
      {
        name: 'externalize-deps',
        setup(build) {
          const packageCache = new Map()
          const resolveByViteResolver = (
            id: string,
            importer: string,
            isRequire: boolean,
          ) => {
            return tryNodeResolve(id, importer, {
              root: path.dirname(fileName),
              isBuild: true,
              isProduction: true,
              preferRelative: false,
              tryIndex: true,
              mainFields: [],
              conditions: [],
              externalConditions: [],
              external: [],
              noExternal: [],
              overrideConditions: ['node'],
              dedupe: [],
              extensions: DEFAULT_EXTENSIONS,
              preserveSymlinks: false,
              packageCache,
              isRequire,
              webCompatible: false,
              nodeCompatible: true,
            })?.id
          }

          // externalize bare imports
          build.onResolve(
            { filter: /^[^.].*/ },
            async ({ path: id, importer, kind }) => {
              if (
                kind === 'entry-point' ||
                path.isAbsolute(id) ||
                isNodeBuiltin(id)
              ) {
                return
              }

              // With the `isNodeBuiltin` check above, this check captures if the builtin is a
              // non-node built-in, which esbuild doesn't know how to handle. In that case, we
              // externalize it so the non-node runtime handles it instead.
              if (isBuiltin(id)) {
                return { external: true }
              }

              const isImport = isESM || kind === 'dynamic-import'
              let idFsPath: string | undefined
              try {
                idFsPath = resolveByViteResolver(id, importer, !isImport)
              } catch (e) {
                if (!isImport) {
                  let canResolveWithImport = false
                  try {
                    canResolveWithImport = !!resolveByViteResolver(
                      id,
                      importer,
                      false,
                    )
                  } catch {}
                  if (canResolveWithImport) {
                    throw new Error(
                      `Failed to resolve ${JSON.stringify(
                        id,
                      )}. This package is ESM only but it was tried to load by \`require\`. See https://vitejs.dev/guide/troubleshooting.html#this-package-is-esm-only for more details.`,
                    )
                  }
                }
                throw e
              }
              if (idFsPath && isImport) {
                idFsPath = pathToFileURL(idFsPath).href
              }
              if (
                idFsPath &&
                !isImport &&
                isFilePathESM(idFsPath, packageCache)
              ) {
                throw new Error(
                  `${JSON.stringify(
                    id,
                  )} resolved to an ESM file. ESM file cannot be loaded by \`require\`. See https://vitejs.dev/guide/troubleshooting.html#this-package-is-esm-only for more details.`,
                )
              }
              return {
                path: idFsPath,
                external: true,
              }
            },
          )
        },
      },
      {
        name: 'inject-file-scope-variables',
        setup(build) {
          build.onLoad({ filter: /\.[cm]?[jt]s$/ }, async (args) => {
            const contents = await fsp.readFile(args.path, 'utf-8')
            const injectValues =
              `const ${dirnameVarName} = ${JSON.stringify(
                path.dirname(args.path),
              )};` +
              `const ${filenameVarName} = ${JSON.stringify(args.path)};` +
              `const ${importMetaUrlVarName} = ${JSON.stringify(
                pathToFileURL(args.path).href,
              )};`

            return {
              loader: args.path.endsWith('ts') ? 'ts' : 'js',
              contents: injectValues + contents,
            }
          })
        },
      },
    ],
  })
  const { text } = result.outputFiles[0]
  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  }
}

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any
}

const _require = createRequire(import.meta.url)
async function loadConfigFromBundledFile(
  fileName: string,
  bundledCode: string,
  isESM: boolean,
): Promise<UserConfigExport> {
  // for esm, before we can register loaders without requiring users to run node
  // with --experimental-loader themselves, we have to do a hack here:
  // write it to disk, load it with native Node ESM, then delete the file.
  if (isESM) {
    const fileBase = `${fileName}.timestamp-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
    const fileNameTmp = `${fileBase}.mjs`
    const fileUrl = `${pathToFileURL(fileBase)}.mjs`
    await fsp.writeFile(fileNameTmp, bundledCode)
    try {
      return (await import(fileUrl)).default
    } finally {
      fs.unlink(fileNameTmp, () => {}) // Ignore errors
    }
  }
  // for cjs, we can register a custom loader via `_require.extensions`
  else {
    const extension = path.extname(fileName)
    // We don't use fsp.realpath() here because it has the same behaviour as
    // fs.realpath.native. On some Windows systems, it returns uppercase volume
    // letters (e.g. "C:\") while the Node.js loader uses lowercase volume letters.
    // See https://github.com/vitejs/vite/issues/12923
    const realFileName = await promisifiedRealpath(fileName)
    const loaderExt = extension in _require.extensions ? extension : '.js'
    const defaultLoader = _require.extensions[loaderExt]!
    _require.extensions[loaderExt] = (module: NodeModule, filename: string) => {
      if (filename === realFileName) {
        ;(module as NodeModuleWithCompile)._compile(bundledCode, filename)
      } else {
        defaultLoader(module, filename)
      }
    }
    // clear cache in case of server restart
    delete _require.cache[_require.resolve(fileName)]
    const raw = _require(fileName)
    _require.extensions[loaderExt] = defaultLoader
    return raw.__esModule ? raw.default : raw
  }
}

async function runConfigHook(
  config: InlineConfig,
  plugins: Plugin[],
  configEnv: ConfigEnv,
): Promise<InlineConfig> {
  let conf = config

  for (const p of getSortedPluginsByHook('config', plugins)) {
    const hook = p.config
    const handler = getHookHandler(hook)
    if (handler) {
      const res = await handler(conf, configEnv)
      if (res) {
        conf = mergeConfig(conf, res)
      }
    }
  }

  return conf
}

async function runConfigEnvironmentHook(
  environments: Record<string, EnvironmentOptions>,
  plugins: Plugin[],
  configEnv: ConfigEnv,
): Promise<void> {
  const environmentNames = Object.keys(environments)
  for (const p of getSortedPluginsByHook('configEnvironment', plugins)) {
    const hook = p.configEnvironment
    const handler = getHookHandler(hook)
    if (handler) {
      for (const name of environmentNames) {
        const res = await handler(name, environments[name], configEnv)
        if (res) {
          environments[name] = mergeConfig(environments[name], res)
        }
      }
    }
  }
}

export function getDepOptimizationConfig(
  config: ResolvedConfig,
  ssr: boolean,
): DepOptimizationConfig {
  return ssr ? config.ssr.optimizeDeps : config.optimizeDeps
}
export function isDepsOptimizerEnabled(
  config: ResolvedConfig,
  ssr: boolean,
): boolean {
  const optimizeDeps = getDepOptimizationConfig(config, ssr)
  return !(optimizeDeps.noDiscovery && !optimizeDeps.include?.length)
}

function optimizeDepsDisabledBackwardCompatibility(
  resolved: ResolvedConfig,
  optimizeDeps: DepOptimizationConfig,
  optimizeDepsPath: string = '',
) {
  const optimizeDepsDisabled = optimizeDeps.disabled
  if (optimizeDepsDisabled !== undefined) {
    if (optimizeDepsDisabled === true || optimizeDepsDisabled === 'dev') {
      const commonjsOptionsInclude = resolved.build?.commonjsOptions?.include
      const commonjsPluginDisabled =
        Array.isArray(commonjsOptionsInclude) &&
        commonjsOptionsInclude.length === 0
      optimizeDeps.noDiscovery = true
      optimizeDeps.include = undefined
      if (commonjsPluginDisabled) {
        resolved.build.commonjsOptions.include = undefined
      }
      resolved.logger.warn(
        colors.yellow(`(!) Experimental ${optimizeDepsPath}optimizeDeps.disabled and deps pre-bundling during build were removed in Vite 5.1.
    To disable the deps optimizer, set ${optimizeDepsPath}optimizeDeps.noDiscovery to true and ${optimizeDepsPath}optimizeDeps.include as undefined or empty.
    Please remove ${optimizeDepsPath}optimizeDeps.disabled from your config.
    ${
      commonjsPluginDisabled
        ? 'Empty config.build.commonjsOptions.include will be ignored to support CJS during build. This config should also be removed.'
        : ''
    }
  `),
      )
    } else if (
      optimizeDepsDisabled === false ||
      optimizeDepsDisabled === 'build'
    ) {
      resolved.logger.warn(
        colors.yellow(`(!) Experimental ${optimizeDepsPath}optimizeDeps.disabled and deps pre-bundling during build were removed in Vite 5.1.
    Setting it to ${optimizeDepsDisabled} now has no effect.
    Please remove ${optimizeDepsPath}optimizeDeps.disabled from your config.
  `),
      )
    }
  }
}
