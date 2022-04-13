import fs from 'fs'
import path from 'path'
import colors from 'picocolors'
import type { InlineConfig, ResolvedConfig } from './config'
import { resolveConfig } from './config'
import type {
  Plugin,
  RollupBuild,
  RollupOptions,
  RollupWarning,
  WarningHandler,
  OutputOptions,
  RollupOutput,
  ExternalOption,
  WatcherOptions,
  RollupWatcher,
  RollupError,
  ModuleFormat
} from 'rollup'
import type Rollup from 'rollup'
import { buildReporterPlugin } from './plugins/reporter'
import { buildEsbuildPlugin } from './plugins/esbuild'
import { terserPlugin } from './plugins/terser'
import type { Terser } from 'types/terser'
import { copyDir, emptyDir, lookupFile, normalizePath } from './utils'
import { manifestPlugin } from './plugins/manifest'
import commonjsPlugin from '@rollup/plugin-commonjs'
import type { RollupCommonJSOptions } from 'types/commonjs'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'
import type { RollupDynamicImportVarsOptions } from 'types/dynamicImportVars'
import type { Logger } from './logger'
import type { TransformOptions } from 'esbuild'
import { dataURIPlugin } from './plugins/dataUri'
import { buildImportAnalysisPlugin } from './plugins/importAnalysisBuild'
import { resolveSSRExternal, shouldExternalizeForSSR } from './ssr/ssrExternal'
import { ssrManifestPlugin } from './ssr/ssrManifestPlugin'
import type { DepOptimizationMetadata } from './optimizer'
import { getDepsCacheDir, findKnownImports } from './optimizer'
import { assetImportMetaUrlPlugin } from './plugins/assetImportMetaUrl'
import { loadFallbackPlugin } from './plugins/loadFallback'
import { watchPackageDataPlugin } from './packages'
import { ensureWatchPlugin } from './plugins/ensureWatch'
import { redirectWorkerImportMetaUrlPlugin } from './plugins/worker'

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
  manifest?: boolean | string
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
  ssrManifest?: boolean | string
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

export function resolveBuildOptions(raw?: BuildOptions): ResolvedBuildOptions {
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
      ...(options.watch ? [ensureWatchPlugin()] : []),
      watchPackageDataPlugin(config),
      commonjsPlugin(options.commonjsOptions),
      dataURIPlugin(),
      dynamicImportVars(options.dynamicImportVarsOptions),
      assetImportMetaUrlPlugin(config),
      redirectWorkerImportMetaUrlPlugin(config),
      ...(options.rollupOptions.plugins
        ? (options.rollupOptions.plugins.filter(Boolean) as Plugin[])
        : [])
    ],
    post: [
      buildImportAnalysisPlugin(config),
      ...(config.esbuild !== false ? [buildEsbuildPlugin(config)] : []),
      ...(options.minify ? [terserPlugin(config)] : []),
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
  const ssr = !!options.ssr
  const libOptions = options.lib

  config.logger.info(
    colors.cyan(
      `vite v${require('vite/package.json').version} ${colors.green(
        `building ${ssr ? `SSR bundle ` : ``}for ${config.mode}...`
      )}`
    )
  )

  const resolve = (p: string) => path.resolve(config.root, p)
  const input = libOptions
    ? resolve(libOptions.entry)
    : typeof options.ssr === 'string'
    ? resolve(options.ssr)
    : options.rollupOptions?.input || resolve('index.html')

  if (ssr && typeof input === 'string' && input.endsWith('.html')) {
    throw new Error(
      `rollupOptions.input should not be an html file when building for SSR. ` +
        `Please specify a dedicated SSR entry.`
    )
  }

  const outDir = resolve(options.outDir)

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
    const dataPath = path.join(getDepsCacheDir(config), '_metadata.json')
    try {
      const data = JSON.parse(
        fs.readFileSync(dataPath, 'utf-8')
      ) as DepOptimizationMetadata
      knownImports = Object.keys(data.optimized)
    } catch (e) {}
    if (!knownImports) {
      // no dev deps optimization data, do a fresh scan
      knownImports = await findKnownImports(config)
    }
    external = resolveExternal(
      resolveSSRExternal(config, knownImports),
      userExternal
    )
  }

  const rollup = require('rollup') as typeof Rollup
  const rollupOptions: RollupOptions = {
    input,
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
    let msg = colors.red((e.plugin ? `[${e.plugin}] ` : '') + e.message)
    if (e.id) {
      msg += `\nfile: ${colors.cyan(
        e.id + (e.loc ? `:${e.loc.line}:${e.loc.column}` : '')
      )}`
    }
    if (e.frame) {
      msg += `\n` + colors.yellow(e.frame)
    }
    config.logger.error(msg, { error: e })
  }

  try {
    const buildOutputOptions = (output: OutputOptions = {}): OutputOptions => {
      // @ts-ignore
      if (output.output) {
        config.logger.warn(
          `You've set "rollupOptions.output.output" in your config. ` +
            `This is deprecated and will override all Vite.js default output options. ` +
            `Please use "rollupOptions.output" instead.`
        )
      }

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
      config.logger.info(colors.cyan(`\nwatching for file changes...`))

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
            ignoreInitial: true,
            ignorePermissionErrors: true,
            ...watcherOptions.chokidar,
            ignored: [
              '**/node_modules/**',
              '**/.git/**',
              ...(watcherOptions?.chokidar?.ignored || [])
            ]
          }
        }
      })

      watcher.on('event', (event) => {
        if (event.code === 'BUNDLE_START') {
          config.logger.info(colors.cyan(`\nbuild started...`))
          if (options.write) {
            prepareOutDir(outDir, options.emptyOutDir, config)
          }
        } else if (event.code === 'BUNDLE_END') {
          event.result.close()
          config.logger.info(colors.cyan(`built in ${event.duration}ms.`))
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
        colors.yellow(
          `\n${colors.bold(`(!)`)} outDir ${colors.white(
            colors.dim(outDir)
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
        colors.yellow(
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
        `${colors.bold(
          colors.yellow(`[plugin:${warning.plugin}]`)
        )} ${colors.yellow(warning.message)}`
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
  return (id, parentId, isResolved) => {
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
  }
}

function isExternal(id: string, test: string | RegExp) {
  if (typeof test === 'string') {
    return id === test
  } else {
    return test.test(id)
  }
}

function injectSsrFlagToHooks(plugin: Plugin): Plugin {
  const { resolveId, load, transform } = plugin
  return {
    ...plugin,
    resolveId: wrapSsrResolveId(resolveId),
    load: wrapSsrLoad(load),
    transform: wrapSsrTransform(transform)
  }
}

function wrapSsrResolveId(
  fn?: Rollup.ResolveIdHook
): Rollup.ResolveIdHook | undefined {
  if (!fn) return

  return function (id, importer, options) {
    return fn.call(this, id, importer, injectSsrFlag(options))
  }
}

function wrapSsrLoad(fn?: Rollup.LoadHook): Rollup.LoadHook | undefined {
  if (!fn) return

  return function (id, ...args) {
    // @ts-expect-error: Receiving options param to be future-proof if Rollup adds it
    return fn.call(this, id, injectSsrFlag(args[0]))
  }
}

function wrapSsrTransform(
  fn?: Rollup.TransformHook
): Rollup.TransformHook | undefined {
  if (!fn) return

  return function (code, importer, ...args) {
    // @ts-expect-error: Receiving options param to be future-proof if Rollup adds it
    return fn.call(this, code, importer, injectSsrFlag(args[0]))
  }
}

function injectSsrFlag<T extends Record<string, any>>(
  options?: T
): T & { ssr: boolean } {
  return { ...(options ?? {}), ssr: true } as T & { ssr: boolean }
}
