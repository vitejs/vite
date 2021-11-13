import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { resolveConfig, InlineConfig, ResolvedConfig } from './config'
import Rollup, {
  Plugin,
  RollupBuild,
  RollupOptions,
  RollupWarning,
  WarningHandler,
  OutputOptions,
  RollupOutput,
  ExternalOption,
  GetManualChunk,
  GetModuleInfo,
  WatcherOptions,
  RollupWatcher,
  RollupError,
  ModuleFormat
} from 'rollup'
import { buildReporterPlugin } from './plugins/reporter'
import { buildHtmlPlugin } from './plugins/html'
import { buildEsbuildPlugin } from './plugins/esbuild'
import { terserPlugin } from './plugins/terser'
import { Terser } from 'types/terser'
import { copyDir, emptyDir, lookupFile, normalizePath } from './utils'
import { manifestPlugin } from './plugins/manifest'
import commonjsPlugin from '@rollup/plugin-commonjs'
import { RollupCommonJSOptions } from 'types/commonjs'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'
import { RollupDynamicImportVarsOptions } from 'types/dynamicImportVars'
import { Logger } from './logger'
import { TransformOptions } from 'esbuild'
import { dataURIPlugin } from './plugins/dataUri'
import { buildImportAnalysisPlugin } from './plugins/importAnalysisBuild'
import { resolveSSRExternal, shouldExternalizeForSSR } from './ssr/ssrExternal'
import { ssrManifestPlugin } from './ssr/ssrManifestPlugin'
import { isCSSRequest } from './plugins/css'
import { DepOptimizationMetadata } from './optimizer'
import { scanImports } from './optimizer/scan'
import { assetImportMetaUrlPlugin } from './plugins/assetImportMetaUrl'
import { loadFallbackPlugin } from './plugins/loadFallback'

export interface BuildOptions {
  /**
   * Base public path when served in production.
   * @deprecated `base` is now a root-level config option.
   */
  base?: string
  /**
   * Compatibility transform target. The transform is performed with esbuild
   * and the lowest supported target is es2015/es6. Note this only handles
   * syntax transformation and does not cover polyfills (except for dynamic
   * import)
   *
   * Default: 'modules' - Similar to `@babel/preset-env`'s targets.esmodules,
   * transpile targeting browsers that natively support dynamic es module imports.
   * https://caniuse.com/es6-module-dynamic-import
   *
   * Another special value is 'esnext' - which only performs minimal transpiling
   * (for minification compat) and assumes native dynamic imports support.
   *
   * For custom targets, see https://esbuild.github.io/api/#target and
   * https://esbuild.github.io/content-types/#javascript for more details.
   */
  target?: 'modules' | TransformOptions['target'] | false
  /**
   * whether to inject module preload polyfill.
   * Note: does not apply to library mode.
   * @default true
   */
  polyfillModulePreload?: boolean
  /**
   * whether to inject dynamic import polyfill.
   * Note: does not apply to library mode.
   * @default false
   * @deprecated use plugin-legacy for browsers that don't support dynamic import
   */
  polyfillDynamicImport?: boolean
  /**
   * Directory relative from `root` where build output will be placed. If the
   * directory exists, it will be removed before the build.
   * @default 'dist'
   */
  outDir?: string
  /**
   * Directory relative from `outDir` where the built js/css/image assets will
   * be placed.
   * @default 'assets'
   */
  assetsDir?: string
  /**
   * Static asset files smaller than this number (in bytes) will be inlined as
   * base64 strings. Default limit is `4096` (4kb). Set to `0` to disable.
   * @default 4096
   */
  assetsInlineLimit?: number
  /**
   * Whether to code-split CSS. When enabled, CSS in async chunks will be
   * inlined as strings in the chunk and inserted via dynamically created
   * style tags when the chunk is loaded.
   * @default true
   */
  cssCodeSplit?: boolean
  /**
   * An optional separate target for CSS minification.
   * As esbuild only supports configuring targets to mainstream
   * browsers, users may need this option when they are targeting
   * a niche browser that comes with most modern JavaScript features
   * but has poor CSS support, e.g. Android WeChat WebView, which
   * doesn't support the #RGBA syntax.
   */
  cssTarget?: TransformOptions['target'] | false
  /**
   * If `true`, a separate sourcemap file will be created. If 'inline', the
   * sourcemap will be appended to the resulting output file as data URI.
   * 'hidden' works like `true` except that the corresponding sourcemap
   * comments in the bundled files are suppressed.
   * @default false
   */
  sourcemap?: boolean | 'inline' | 'hidden'
  /**
   * Set to `false` to disable minification, or specify the minifier to use.
   * Available options are 'terser' or 'esbuild'.
   * @default 'esbuild'
   */
  minify?: boolean | 'terser' | 'esbuild'
  /**
   * Options for terser
   * https://terser.org/docs/api-reference#minify-options
   */
  terserOptions?: Terser.MinifyOptions
  /**
   * @deprecated Vite now uses esbuild for CSS minification.
   */
  cleanCssOptions?: any
  /**
   * Will be merged with internal rollup options.
   * https://rollupjs.org/guide/en/#big-list-of-options
   */
  rollupOptions?: RollupOptions
  /**
   * Options to pass on to `@rollup/plugin-commonjs`
   */
  commonjsOptions?: RollupCommonJSOptions
  /**
   * Options to pass on to `@rollup/plugin-dynamic-import-vars`
   */
  dynamicImportVarsOptions?: RollupDynamicImportVarsOptions
  /**
   * Whether to write bundle to disk
   * @default true
   */
  write?: boolean
  /**
   * Empty outDir on write.
   * @default true when outDir is a sub directory of project root
   */
  emptyOutDir?: boolean | null
  /**
   * Whether to emit a manifest.json under assets dir to map hash-less filenames
   * to their hashed versions. Useful when you want to generate your own HTML
   * instead of using the one generated by Vite.
   *
   * Example:
   *
   * ```json
   * {
   *   "main.js": {
   *     "file": "main.68fe3fad.js",
   *     "css": "main.e6b63442.css",
   *     "imports": [...],
   *     "dynamicImports": [...]
   *   }
   * }
   * ```
   * @default false
   */
  manifest?: boolean
  /**
   * Build in library mode. The value should be the global name of the lib in
   * UMD mode. This will produce esm + cjs + umd bundle formats with default
   * configurations that are suitable for distributing libraries.
   */
  lib?: LibraryOptions | false
  /**
   * Produce SSR oriented build. Note this requires specifying SSR entry via
   * `rollupOptions.input`.
   */
  ssr?: boolean | string
  /**
   * Generate SSR manifest for determining style links and asset preload
   * directives in production.
   */
  ssrManifest?: boolean
  /**
   * Set to false to disable reporting compressed chunk sizes.
   * Can slightly improve build speed.
   */
  reportCompressedSize?: boolean
  /**
   * Set to false to disable brotli compressed size reporting for build.
   * Can slightly improve build speed.
   * @deprecated use `build.reportCompressedSize` instead.
   */
  brotliSize?: boolean
  /**
   * Adjust chunk size warning limit (in kbs).
   * @default 500
   */
  chunkSizeWarningLimit?: number
  /**
   * Rollup watch options
   * https://rollupjs.org/guide/en/#watchoptions
   */
  watch?: WatcherOptions | null
}

export interface LibraryOptions {
  entry: string
  name?: string
  formats?: LibraryFormats[]
  fileName?: string | ((format: ModuleFormat) => string)
}

export type LibraryFormats = 'es' | 'cjs' | 'umd' | 'iife'

export type ResolvedBuildOptions = Required<
  Omit<
    BuildOptions,
    // make deprecated options optional
    'base' | 'cleanCssOptions' | 'polyfillDynamicImport' | 'brotliSize'
  >
>

export function resolveBuildOptions(root: string, raw?: BuildOptions): ResolvedBuildOptions {
  const resolved: ResolvedBuildOptions = {
    target: 'modules',
    polyfillModulePreload: true,
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    cssCodeSplit: !raw?.lib,
    cssTarget: false,
    sourcemap: false,
    rollupOptions: {},
    minify: raw?.ssr ? false : 'esbuild',
    terserOptions: {},
    write: true,
    emptyOutDir: null,
    manifest: false,
    lib: false,
    ssr: false,
    ssrManifest: false,
    reportCompressedSize: true,
    // brotliSize: true,
    chunkSizeWarningLimit: 500,
    watch: null,
    ...raw,
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
      ...raw?.commonjsOptions
    },
    dynamicImportVarsOptions: {
      warnOnError: true,
      exclude: [/node_modules/],
      ...raw?.dynamicImportVarsOptions
    }
  }

  const resolve = (p: string) => p.startsWith('\0') ? p : path.resolve(root, p)

  resolved.outDir = resolve(resolved.outDir)

  let input

  if (raw?.rollupOptions?.input) {
    input = Array.isArray(raw.rollupOptions.input)
      ? raw.rollupOptions.input.map(input => resolve(input))
      : typeof raw.rollupOptions.input === 'object'
      ? Object.assign(
          // @ts-ignore
          ...Object.keys(raw.rollupOptions.input).map(key => ({ [key]: resolve(raw.rollupOptions.input[key]) }))
        )
      : resolve(raw.rollupOptions.input)
  } else {
    input = resolve(
      raw?.lib
        ? raw.lib.entry
        : typeof raw?.ssr === 'string'
        ? raw.ssr
        : 'index.html'
    )
  }

  if (!!raw?.ssr && typeof input === 'string' && input.endsWith('.html')) {
    throw new Error(
      `rollupOptions.input should not be an html file when building for SSR. ` +
        `Please specify a dedicated SSR entry.`
    )
  }

  resolved.rollupOptions.input = input

  // handle special build targets
  if (resolved.target === 'modules') {
    // Support browserslist
    // "defaults and supports es6-module and supports es6-module-dynamic-import",
    resolved.target = [
      'es2019',
      'edge88',
      'firefox78',
      'chrome87',
      'safari13.1'
    ]
  } else if (resolved.target === 'esnext' && resolved.minify === 'terser') {
    // esnext + terser: limit to es2019 so it can be minified by terser
    resolved.target = 'es2019'
  }

  if (!resolved.cssTarget) {
    resolved.cssTarget = resolved.target
  }

  // normalize false string into actual false
  if ((resolved.minify as any) === 'false') {
    resolved.minify = false
  }

  if (resolved.minify === true) {
    resolved.minify = 'esbuild'
  }

  return resolved
}

export function resolveBuildPlugins(config: ResolvedConfig): {
  pre: Plugin[]
  post: Plugin[]
} {
  const options = config.build
  return {
    pre: [
      buildHtmlPlugin(config),
      commonjsPlugin(options.commonjsOptions),
      dataURIPlugin(),
      dynamicImportVars(options.dynamicImportVarsOptions),
      assetImportMetaUrlPlugin(config),
      ...(options.rollupOptions.plugins
        ? (options.rollupOptions.plugins.filter((p) => !!p) as Plugin[])
        : [])
    ],
    post: [
      buildImportAnalysisPlugin(config),
      buildEsbuildPlugin(config),
      ...(options.minify === 'terser' ? [terserPlugin(config)] : []),
      ...(options.manifest ? [manifestPlugin(config)] : []),
      ...(options.ssrManifest ? [ssrManifestPlugin(config)] : []),
      buildReporterPlugin(config),
      loadFallbackPlugin()
    ]
  }
}

/**
 * Track parallel build calls and only stop the esbuild service when all
 * builds are done. (#1098)
 */
let parallelCallCounts = 0
// we use a separate counter to track since the call may error before the
// bundle is even pushed.
const parallelBuilds: RollupBuild[] = []

/**
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export async function build(
  inlineConfig: InlineConfig = {}
): Promise<RollupOutput | RollupOutput[] | RollupWatcher> {
  parallelCallCounts++
  try {
    return await doBuild(inlineConfig)
  } finally {
    parallelCallCounts--
    if (parallelCallCounts <= 0) {
      await Promise.all(parallelBuilds.map((bundle) => bundle.close()))
      parallelBuilds.length = 0
    }
  }
}

async function doBuild(
  inlineConfig: InlineConfig = {}
): Promise<RollupOutput | RollupOutput[] | RollupWatcher> {
  const config = await resolveConfig(inlineConfig, 'build', 'production')
  const options = config.build
  const input = options.rollupOptions.input
  const outDir = options.outDir
  const ssr = !!options.ssr
  const libOptions = options.lib

  config.logger.info(
    chalk.cyan(
      `vite v${require('vite/package.json').version} ${chalk.green(
        `building ${ssr ? `SSR bundle ` : ``}for ${config.mode}...`
      )}`
    )
  )

  // inject ssr arg to plugin load/transform hooks
  const plugins = (
    ssr ? config.plugins.map((p) => injectSsrFlagToHooks(p)) : config.plugins
  ) as Plugin[]

  // inject ssrExternal if present
  const userExternal = options.rollupOptions?.external
  let external = userExternal
  if (ssr) {
    // see if we have cached deps data available
    let knownImports: string[] | undefined
    if (config.cacheDir) {
      const dataPath = path.join(config.cacheDir, '_metadata.json')
      try {
        const data = JSON.parse(
          fs.readFileSync(dataPath, 'utf-8')
        ) as DepOptimizationMetadata
        knownImports = Object.keys(data.optimized)
      } catch (e) {}
    }
    if (!knownImports) {
      // no dev deps optimization data, do a fresh scan
      knownImports = Object.keys((await scanImports(config)).deps)
    }
    external = resolveExternal(
      resolveSSRExternal(config, knownImports),
      userExternal
    )
  }

  const rollup = require('rollup') as typeof Rollup
  const rollupOptions: RollupOptions = {
    context: 'globalThis',
    preserveEntrySignatures: ssr
      ? 'allow-extension'
      : libOptions
      ? 'strict'
      : false,
    ...options.rollupOptions,
    plugins,
    external,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    }
  }

  const outputBuildError = (e: RollupError) => {
    let msg = chalk.red((e.plugin ? `[${e.plugin}] ` : '') + e.message)
    if (e.id) {
      msg += `\nfile: ${chalk.cyan(
        e.id + (e.loc ? `:${e.loc.line}:${e.loc.column}` : '')
      )}`
    }
    if (e.frame) {
      msg += `\n` + chalk.yellow(e.frame)
    }
    config.logger.error(msg, { error: e })
  }

  try {
    const buildOutputOptions = (output: OutputOptions = {}): OutputOptions => {
      return {
        dir: outDir,
        format: ssr ? 'cjs' : 'es',
        exports: ssr ? 'named' : 'auto',
        sourcemap: options.sourcemap,
        name: libOptions ? libOptions.name : undefined,
        entryFileNames: ssr
          ? `[name].js`
          : libOptions
          ? resolveLibFilename(libOptions, output.format || 'es', config.root)
          : path.posix.join(options.assetsDir, `[name].[hash].js`),
        chunkFileNames: libOptions
          ? `[name].js`
          : path.posix.join(options.assetsDir, `[name].[hash].js`),
        assetFileNames: libOptions
          ? `[name].[ext]`
          : path.posix.join(options.assetsDir, `[name].[hash].[ext]`),
        // #764 add `Symbol.toStringTag` when build es module into cjs chunk
        // #1048 add `Symbol.toStringTag` for module default export
        namespaceToStringTag: true,
        inlineDynamicImports: ssr && typeof input === 'string',
        manualChunks:
          !ssr &&
          !libOptions &&
          output?.format !== 'umd' &&
          output?.format !== 'iife'
            ? createMoveToVendorChunkFn(config)
            : undefined,
        ...output
      }
    }

    // resolve lib mode outputs
    const outputs = resolveBuildOutputs(
      options.rollupOptions?.output,
      libOptions,
      config.logger
    )

    // watch file changes with rollup
    if (config.build.watch) {
      config.logger.info(chalk.cyanBright(`\nwatching for file changes...`))

      const output: OutputOptions[] = []
      if (Array.isArray(outputs)) {
        for (const resolvedOutput of outputs) {
          output.push(buildOutputOptions(resolvedOutput))
        }
      } else {
        output.push(buildOutputOptions(outputs))
      }

      const watcherOptions = config.build.watch
      const watcher = rollup.watch({
        ...rollupOptions,
        output,
        watch: {
          ...watcherOptions,
          chokidar: {
            ignored: [
              '**/node_modules/**',
              '**/.git/**',
              ...(watcherOptions?.chokidar?.ignored || [])
            ],
            ignoreInitial: true,
            ignorePermissionErrors: true,
            ...watcherOptions.chokidar
          }
        }
      })

      watcher.on('event', (event) => {
        if (event.code === 'BUNDLE_START') {
          config.logger.info(chalk.cyanBright(`\nbuild started...`))
          if (options.write) {
            prepareOutDir(outDir, options.emptyOutDir, config)
          }
        } else if (event.code === 'BUNDLE_END') {
          event.result.close()
          config.logger.info(chalk.cyanBright(`built in ${event.duration}ms.`))
        } else if (event.code === 'ERROR') {
          outputBuildError(event.error)
        }
      })

      // stop watching
      watcher.close()

      return watcher
    }

    // write or generate files with rollup
    const bundle = await rollup.rollup(rollupOptions)
    parallelBuilds.push(bundle)

    const generate = (output: OutputOptions = {}) => {
      return bundle[options.write ? 'write' : 'generate'](
        buildOutputOptions(output)
      )
    }

    if (options.write) {
      prepareOutDir(outDir, options.emptyOutDir, config)
    }

    if (Array.isArray(outputs)) {
      const res = []
      for (const output of outputs) {
        res.push(await generate(output))
      }
      return res
    } else {
      return await generate(outputs)
    }
  } catch (e) {
    outputBuildError(e)
    throw e
  }
}

function prepareOutDir(
  outDir: string,
  emptyOutDir: boolean | null,
  config: ResolvedConfig
) {
  if (fs.existsSync(outDir)) {
    if (
      emptyOutDir == null &&
      !normalizePath(outDir).startsWith(config.root + '/')
    ) {
      // warn if outDir is outside of root
      config.logger.warn(
        chalk.yellow(
          `\n${chalk.bold(`(!)`)} outDir ${chalk.white.dim(
            outDir
          )} is not inside project root and will not be emptied.\n` +
            `Use --emptyOutDir to override.\n`
        )
      )
    } else if (emptyOutDir !== false) {
      emptyDir(outDir, ['.git'])
    }
  }
  if (config.publicDir && fs.existsSync(config.publicDir)) {
    copyDir(config.publicDir, outDir)
  }
}

function getPkgName(root: string) {
  const { name } = JSON.parse(lookupFile(root, ['package.json']) || `{}`)

  return name?.startsWith('@') ? name.split('/')[1] : name
}

function createMoveToVendorChunkFn(config: ResolvedConfig): GetManualChunk {
  const cache = new Map<string, boolean>()
  return (id, { getModuleInfo }) => {
    if (
      id.includes('node_modules') &&
      !isCSSRequest(id) &&
      staticImportedByEntry(id, getModuleInfo, cache)
    ) {
      return 'vendor'
    }
  }
}

function staticImportedByEntry(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importStack: string[] = []
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean
  }
  if (importStack.includes(id)) {
    // circular deps!
    cache.set(id, false)
    return false
  }
  const mod = getModuleInfo(id)
  if (!mod) {
    cache.set(id, false)
    return false
  }

  if (mod.isEntry) {
    cache.set(id, true)
    return true
  }
  const someImporterIs = mod.importers.some((importer) =>
    staticImportedByEntry(
      importer,
      getModuleInfo,
      cache,
      importStack.concat(id)
    )
  )
  cache.set(id, someImporterIs)
  return someImporterIs
}

export function resolveLibFilename(
  libOptions: LibraryOptions,
  format: ModuleFormat,
  root: string
): string {
  if (typeof libOptions.fileName === 'function') {
    return libOptions.fileName(format)
  }

  const name = libOptions.fileName || getPkgName(root)

  if (!name)
    throw new Error(
      'Name in package.json is required if option "build.lib.fileName" is not provided.'
    )

  return `${name}.${format}.js`
}

function resolveBuildOutputs(
  outputs: OutputOptions | OutputOptions[] | undefined,
  libOptions: LibraryOptions | false,
  logger: Logger
): OutputOptions | OutputOptions[] | undefined {
  if (libOptions) {
    const formats = libOptions.formats || ['es', 'umd']
    if (
      (formats.includes('umd') || formats.includes('iife')) &&
      !libOptions.name
    ) {
      throw new Error(
        `Option "build.lib.name" is required when output formats ` +
          `include "umd" or "iife".`
      )
    }
    if (!outputs) {
      return formats.map((format) => ({ format }))
    } else if (!Array.isArray(outputs)) {
      return formats.map((format) => ({ ...outputs, format }))
    } else if (libOptions.formats) {
      // user explicitly specifying own output array
      logger.warn(
        chalk.yellow(
          `"build.lib.formats" will be ignored because ` +
            `"build.rollupOptions.output" is already an array format`
        )
      )
    }
  }
  return outputs
}

const warningIgnoreList = [`CIRCULAR_DEPENDENCY`, `THIS_IS_UNDEFINED`]
const dynamicImportWarningIgnoreList = [
  `Unsupported expression`,
  `statically analyzed`
]

export function onRollupWarning(
  warning: RollupWarning,
  warn: WarningHandler,
  config: ResolvedConfig
): void {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    const id = warning.source
    const importer = warning.importer
    // throw unless it's commonjs external...
    if (!importer || !/\?commonjs-external$/.test(importer)) {
      throw new Error(
        `[vite]: Rollup failed to resolve import "${id}" from "${importer}".\n` +
          `This is most likely unintended because it can break your application at runtime.\n` +
          `If you do want to externalize this module explicitly add it to\n` +
          `\`build.rollupOptions.external\``
      )
    }
  }

  if (
    warning.plugin === 'rollup-plugin-dynamic-import-variables' &&
    dynamicImportWarningIgnoreList.some((msg) => warning.message.includes(msg))
  ) {
    return
  }

  if (!warningIgnoreList.includes(warning.code!)) {
    const userOnWarn = config.build.rollupOptions?.onwarn
    if (userOnWarn) {
      userOnWarn(warning, warn)
    } else if (warning.code === 'PLUGIN_WARNING') {
      config.logger.warn(
        `${chalk.bold.yellow(`[plugin:${warning.plugin}]`)} ${chalk.yellow(
          warning.message
        )}`
      )
    } else {
      warn(warning)
    }
  }
}

function resolveExternal(
  ssrExternals: string[],
  user: ExternalOption | undefined
): ExternalOption {
  return ((id, parentId, isResolved) => {
    if (shouldExternalizeForSSR(id, ssrExternals)) {
      return true
    }
    if (user) {
      if (typeof user === 'function') {
        return user(id, parentId, isResolved)
      } else if (Array.isArray(user)) {
        return user.some((test) => isExternal(id, test))
      } else {
        return isExternal(id, user)
      }
    }
  }) as ExternalOption
}

function isExternal(id: string, test: string | RegExp) {
  if (typeof test === 'string') {
    return id === test
  } else {
    return test.test(id)
  }
}

function injectSsrFlagToHooks(p: Plugin): Plugin {
  const { resolveId, load, transform } = p
  return {
    ...p,
    resolveId: wrapSsrResolveId(resolveId),
    load: wrapSsrLoad(load),
    transform: wrapSsrTransform(transform)
  }
}

function wrapSsrResolveId(fn: Function | undefined) {
  if (!fn) return
  return function (this: any, id: any, importer: any, options: any) {
    return fn.call(this, id, importer, injectSsrFlag(options))
  }
}

function wrapSsrLoad(fn: Function | undefined) {
  if (!fn) return
  // Receiving options param to be future-proof if Rollup adds it
  return function (this: any, id: any, ...args: any[]) {
    return fn.call(this, id, injectSsrFlag(args[0]))
  }
}

function wrapSsrTransform(fn: Function | undefined) {
  if (!fn) return
  // Receiving options param to be future-proof if Rollup adds it
  return function (this: any, code: any, importer: any, ...args: any[]) {
    return fn.call(this, code, importer, injectSsrFlag(args[0]))
  }
}

function injectSsrFlag(options: any = {}) {
  return { ...options, ssr: true }
}
