import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import _debug from 'debug'
import colors from 'picocolors'
import type { BuildContext, BuildOptions as EsbuildBuildOptions } from 'esbuild'
import esbuild, { build } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import { createFilter } from '@rollup/pluginutils'
import { getDepOptimizationConfig } from '../config'
import type { ResolvedConfig } from '../config'
import {
  arraify,
  createDebugger,
  emptyDir,
  flattenId,
  getHash,
  isOptimizable,
  lookupFile,
  normalizeId,
  normalizePath,
  removeDir,
  renameDir,
  writeFile,
} from '../utils'
import { transformWithEsbuild } from '../plugins/esbuild'
import { ESBUILD_MODULES_TARGET } from '../constants'
import { esbuildCjsExternalPlugin, esbuildDepPlugin } from './esbuildDepPlugin'
import { scanImports } from './scan'
export {
  initDepsOptimizer,
  initDevSsrDepsOptimizer,
  getDepsOptimizer,
} from './optimizer'

export const debuggerViteDeps = createDebugger('vite:deps')
const debug = debuggerViteDeps
const isDebugEnabled = _debug('vite:deps').enabled

const jsExtensionRE = /\.js$/i
const jsMapExtensionRE = /\.js\.map$/i

export type ExportsData = {
  hasImports: boolean
  // exported names (for `export { a as b }`, `b` is exported name)
  exports: readonly string[]
  facade: boolean
  // es-module-lexer has a facade detection but isn't always accurate for our
  // use case when the module has default export
  hasReExports?: boolean
  // hint if the dep requires loading as jsx
  jsxLoader?: boolean
}

export interface DepsOptimizer {
  metadata: DepOptimizationMetadata
  scanProcessing?: Promise<void>
  registerMissingImport: (id: string, resolved: string) => OptimizedDepInfo
  run: () => void

  isOptimizedDepFile: (id: string) => boolean
  isOptimizedDepUrl: (url: string) => boolean
  getOptimizedDepId: (depInfo: OptimizedDepInfo) => string
  delayDepsOptimizerUntil: (id: string, done: () => Promise<any>) => void
  registerWorkersSource: (id: string) => void
  resetRegisteredIds: () => void
  ensureFirstRun: () => void

  close: () => Promise<void>

  options: DepOptimizationOptions
}

export interface DepOptimizationConfig {
  /**
   * Force optimize listed dependencies (must be resolvable import paths,
   * cannot be globs).
   */
  include?: string[]
  /**
   * Do not optimize these dependencies (must be resolvable import paths,
   * cannot be globs).
   */
  exclude?: string[]
  /**
   * Force ESM interop when importing for these dependencies. Some legacy
   * packages advertise themselves as ESM but use `require` internally
   * @experimental
   */
  needsInterop?: string[]
  /**
   * Options to pass to esbuild during the dep scanning and optimization
   *
   * Certain options are omitted since changing them would not be compatible
   * with Vite's dep optimization.
   *
   * - `external` is also omitted, use Vite's `optimizeDeps.exclude` option
   * - `plugins` are merged with Vite's dep plugin
   *
   * https://esbuild.github.io/api
   */
  esbuildOptions?: Omit<
    EsbuildBuildOptions,
    | 'bundle'
    | 'entryPoints'
    | 'external'
    | 'write'
    | 'watch'
    | 'outdir'
    | 'outfile'
    | 'outbase'
    | 'outExtension'
    | 'metafile'
  >
  /**
   * List of file extensions that can be optimized. A corresponding esbuild
   * plugin must exist to handle the specific extension.
   *
   * By default, Vite can optimize `.mjs`, `.js`, `.ts`, and `.mts` files. This option
   * allows specifying additional extensions.
   *
   * @experimental
   */
  extensions?: string[]
  /**
   * Disables dependencies optimizations, true disables the optimizer during
   * build and dev. Pass 'build' or 'dev' to only disable the optimizer in
   * one of the modes. Deps optimization is enabled by default in dev only.
   * @default 'build'
   * @experimental
   */
  disabled?: boolean | 'build' | 'dev'
}

export type DepOptimizationOptions = DepOptimizationConfig & {
  /**
   * By default, Vite will crawl your `index.html` to detect dependencies that
   * need to be pre-bundled. If `build.rollupOptions.input` is specified, Vite
   * will crawl those entry points instead.
   *
   * If neither of these fit your needs, you can specify custom entries using
   * this option - the value should be a fast-glob pattern or array of patterns
   * (https://github.com/mrmlnc/fast-glob#basic-syntax) that are relative from
   * vite project root. This will overwrite default entries inference.
   */
  entries?: string | string[]
  /**
   * Force dep pre-optimization regardless of whether deps have changed.
   * @experimental
   */
  force?: boolean
}

export interface DepOptimizationResult {
  metadata: DepOptimizationMetadata
  /**
   * When doing a re-run, if there are newly discovered dependencies
   * the page reload will be delayed until the next rerun so we need
   * to be able to discard the result
   */
  commit: () => Promise<void>
  cancel: () => void
}

export interface DepOptimizationProcessing {
  promise: Promise<void>
  resolve: () => void
}

export interface OptimizedDepInfo {
  id: string
  file: string
  src?: string
  needsInterop?: boolean
  browserHash?: string
  fileHash?: string
  /**
   * During optimization, ids can still be resolved to their final location
   * but the bundles may not yet be saved to disk
   */
  processing?: Promise<void>
  /**
   * ExportData cache, discovered deps will parse the src entry to get exports
   * data used both to define if interop is needed and when pre-bundling
   */
  exportsData?: Promise<ExportsData>
}

export interface DepOptimizationMetadata {
  /**
   * The main hash is determined by user config and dependency lockfiles.
   * This is checked on server startup to avoid unnecessary re-bundles.
   */
  hash: string
  /**
   * The browser hash is determined by the main hash plus additional dependencies
   * discovered at runtime. This is used to invalidate browser requests to
   * optimized deps.
   */
  browserHash: string
  /**
   * Metadata for each already optimized dependency
   */
  optimized: Record<string, OptimizedDepInfo>
  /**
   * Metadata for non-entry optimized chunks and dynamic imports
   */
  chunks: Record<string, OptimizedDepInfo>
  /**
   * Metadata for each newly discovered dependency after processing
   */
  discovered: Record<string, OptimizedDepInfo>
  /**
   * OptimizedDepInfo list
   */
  depInfoList: OptimizedDepInfo[]
}

/**
 * Scan and optimize dependencies within a project.
 * Used by Vite CLI when running `vite optimize`.
 */
export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.optimizeDeps.force,
  asCommand = false,
): Promise<DepOptimizationMetadata> {
  const log = asCommand ? config.logger.info : debug

  const ssr = config.command === 'build' && !!config.build.ssr

  const cachedMetadata = loadCachedDepOptimizationMetadata(
    config,
    ssr,
    force,
    asCommand,
  )
  if (cachedMetadata) {
    return cachedMetadata
  }

  const deps = await discoverProjectDependencies(config).result

  const depsString = depsLogString(Object.keys(deps))
  log(colors.green(`Optimizing dependencies:\n  ${depsString}`))

  await addManuallyIncludedOptimizeDeps(deps, config, ssr)

  const depsInfo = toDiscoveredDependencies(config, deps, ssr)

  const result = await runOptimizeDeps(config, depsInfo).result

  await result.commit()

  return result.metadata
}

export async function optimizeServerSsrDeps(
  config: ResolvedConfig,
): Promise<DepOptimizationMetadata> {
  const ssr = true
  const cachedMetadata = loadCachedDepOptimizationMetadata(
    config,
    ssr,
    config.optimizeDeps.force,
    false,
  )
  if (cachedMetadata) {
    return cachedMetadata
  }

  let alsoInclude: string[] | undefined
  let noExternalFilter: ((id: unknown) => boolean) | undefined

  const { exclude } = getDepOptimizationConfig(config, ssr)

  const noExternal = config.ssr?.noExternal
  if (noExternal) {
    alsoInclude = arraify(noExternal).filter(
      (ne) => typeof ne === 'string',
    ) as string[]
    noExternalFilter =
      noExternal === true
        ? (dep: unknown) => true
        : createFilter(undefined, exclude, {
            resolve: false,
          })
  }

  const deps: Record<string, string> = {}

  await addManuallyIncludedOptimizeDeps(
    deps,
    config,
    ssr,
    alsoInclude,
    noExternalFilter,
  )

  const depsInfo = toDiscoveredDependencies(config, deps, true)

  const result = await runOptimizeDeps(config, depsInfo, true).result

  await result.commit()

  return result.metadata
}

export function initDepsOptimizerMetadata(
  config: ResolvedConfig,
  ssr: boolean,
  timestamp?: string,
): DepOptimizationMetadata {
  const hash = getDepHash(config, ssr)
  return {
    hash,
    browserHash: getOptimizedBrowserHash(hash, {}, timestamp),
    optimized: {},
    chunks: {},
    discovered: {},
    depInfoList: [],
  }
}

export function addOptimizedDepInfo(
  metadata: DepOptimizationMetadata,
  type: 'optimized' | 'discovered' | 'chunks',
  depInfo: OptimizedDepInfo,
): OptimizedDepInfo {
  metadata[type][depInfo.id] = depInfo
  metadata.depInfoList.push(depInfo)
  return depInfo
}

/**
 * Creates the initial dep optimization metadata, loading it from the deps cache
 * if it exists and pre-bundling isn't forced
 */
export function loadCachedDepOptimizationMetadata(
  config: ResolvedConfig,
  ssr: boolean,
  force = config.optimizeDeps.force,
  asCommand = false,
): DepOptimizationMetadata | undefined {
  const log = asCommand ? config.logger.info : debug

  // Before Vite 2.9, dependencies were cached in the root of the cacheDir
  // For compat, we remove the cache if we find the old structure
  if (fs.existsSync(path.join(config.cacheDir, '_metadata.json'))) {
    emptyDir(config.cacheDir)
  }

  const depsCacheDir = getDepsCacheDir(config, ssr)

  if (!force) {
    let cachedMetadata: DepOptimizationMetadata | undefined
    try {
      const cachedMetadataPath = path.join(depsCacheDir, '_metadata.json')
      cachedMetadata = parseDepsOptimizerMetadata(
        fs.readFileSync(cachedMetadataPath, 'utf-8'),
        depsCacheDir,
      )
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (cachedMetadata && cachedMetadata.hash === getDepHash(config, ssr)) {
      log('Hash is consistent. Skipping. Use --force to override.')
      // Nothing to commit or cancel as we are using the cache, we only
      // need to resolve the processing promise so requests can move on
      return cachedMetadata
    }
  } else {
    config.logger.info('Forced re-optimization of dependencies')
  }

  // Start with a fresh cache
  fs.rmSync(depsCacheDir, { recursive: true, force: true })
}

/**
 * Initial optimizeDeps at server start. Perform a fast scan using esbuild to
 * find deps to pre-bundle and include user hard-coded dependencies
 */
export function discoverProjectDependencies(config: ResolvedConfig): {
  cancel: () => Promise<void>
  result: Promise<Record<string, string>>
} {
  const { cancel, result } = scanImports(config)

  return {
    cancel,
    result: result.then(({ deps, missing }) => {
      const missingIds = Object.keys(missing)
      if (missingIds.length) {
        throw new Error(
          `The following dependencies are imported but could not be resolved:\n\n  ${missingIds
            .map(
              (id) =>
                `${colors.cyan(id)} ${colors.white(
                  colors.dim(`(imported by ${missing[id]})`),
                )}`,
            )
            .join(`\n  `)}\n\nAre they installed?`,
        )
      }

      return deps
    }),
  }
}

export function toDiscoveredDependencies(
  config: ResolvedConfig,
  deps: Record<string, string>,
  ssr: boolean,
  timestamp?: string,
): Record<string, OptimizedDepInfo> {
  const browserHash = getOptimizedBrowserHash(
    getDepHash(config, ssr),
    deps,
    timestamp,
  )
  const discovered: Record<string, OptimizedDepInfo> = {}
  for (const id in deps) {
    const src = deps[id]
    discovered[id] = {
      id,
      file: getOptimizedDepPath(id, config, ssr),
      src,
      browserHash: browserHash,
      exportsData: extractExportsData(src, config, ssr),
    }
  }
  return discovered
}

export function depsLogString(qualifiedIds: string[]): string {
  if (isDebugEnabled) {
    return colors.yellow(qualifiedIds.join(`, `))
  } else {
    const total = qualifiedIds.length
    const maxListed = 5
    const listed = Math.min(total, maxListed)
    const extra = Math.max(0, total - maxListed)
    return colors.yellow(
      qualifiedIds.slice(0, listed).join(`, `) +
        (extra > 0 ? `, ...and ${extra} more` : ``),
    )
  }
}

/**
 * Internally, Vite uses this function to prepare a optimizeDeps run. When Vite starts, we can get
 * the metadata and start the server without waiting for the optimizeDeps processing to be completed
 */
export function runOptimizeDeps(
  resolvedConfig: ResolvedConfig,
  depsInfo: Record<string, OptimizedDepInfo>,
  ssr: boolean = resolvedConfig.command === 'build' &&
    !!resolvedConfig.build.ssr,
): {
  cancel: () => Promise<void>
  result: Promise<DepOptimizationResult>
} {
  const optimizerContext = { cancelled: false }

  const config: ResolvedConfig = {
    ...resolvedConfig,
    command: 'build',
  }

  const depsCacheDir = getDepsCacheDir(resolvedConfig, ssr)
  const processingCacheDir = getProcessingDepsCacheDir(resolvedConfig, ssr)

  // Create a temporal directory so we don't need to delete optimized deps
  // until they have been processed. This also avoids leaving the deps cache
  // directory in a corrupted state if there is an error
  if (fs.existsSync(processingCacheDir)) {
    emptyDir(processingCacheDir)
  } else {
    fs.mkdirSync(processingCacheDir, { recursive: true })
  }

  // a hint for Node.js
  // all files in the cache directory should be recognized as ES modules
  writeFile(
    path.resolve(processingCacheDir, 'package.json'),
    JSON.stringify({ type: 'module' }),
  )

  const metadata = initDepsOptimizerMetadata(config, ssr)

  metadata.browserHash = getOptimizedBrowserHash(
    metadata.hash,
    depsFromOptimizedDepInfo(depsInfo),
  )

  // We prebundle dependencies with esbuild and cache them, but there is no need
  // to wait here. Code that needs to access the cached deps needs to await
  // the optimizedDepInfo.processing promise for each dep

  const qualifiedIds = Object.keys(depsInfo)

  let cleaned = false
  const cleanUp = () => {
    if (!cleaned) {
      cleaned = true
      fs.rmSync(processingCacheDir, { recursive: true, force: true })
    }
  }
  const createProcessingResult = () => ({
    metadata,
    async commit() {
      if (cleaned) {
        throw new Error(
          `Vite Internal Error: Can't commit optimizeDeps processing result, it has already been cancelled.`,
        )
      }
      // Write metadata file, delete `deps` folder and rename the `processing` folder to `deps`
      // Processing is done, we can now replace the depsCacheDir with processingCacheDir
      // Rewire the file paths from the temporal processing dir to the final deps cache dir
      await removeDir(depsCacheDir)
      await renameDir(processingCacheDir, depsCacheDir)
    },
    cancel: cleanUp,
  })

  if (!qualifiedIds.length) {
    return {
      cancel: async () => cleanUp(),
      result: Promise.resolve(createProcessingResult()),
    }
  }

  const start = performance.now()

  const preparedRun = prepareEsbuildOptimizerRun(
    resolvedConfig,
    depsInfo,
    ssr,
    processingCacheDir,
    optimizerContext,
  )

  const result = preparedRun.then(({ context, idToExports }) => {
    function disposeContext() {
      return context?.dispose().catch((e) => {
        config.logger.error('Failed to dispose esbuild context', { error: e })
      })
    }
    if (!context || optimizerContext.cancelled) {
      disposeContext()
      return createProcessingResult()
    }

    return context
      .rebuild()
      .then((result) => {
        const meta = result.metafile!

        // the paths in `meta.outputs` are relative to `process.cwd()`
        const processingCacheDirOutputPath = path.relative(
          process.cwd(),
          processingCacheDir,
        )

        for (const id in depsInfo) {
          const output = esbuildOutputFromId(
            meta.outputs,
            id,
            processingCacheDir,
          )

          const { exportsData, ...info } = depsInfo[id]
          addOptimizedDepInfo(metadata, 'optimized', {
            ...info,
            // We only need to hash the output.imports in to check for stability, but adding the hash
            // and file path gives us a unique hash that may be useful for other things in the future
            fileHash: getHash(
              metadata.hash +
                depsInfo[id].file +
                JSON.stringify(output.imports),
            ),
            browserHash: metadata.browserHash,
            // After bundling we have more information and can warn the user about legacy packages
            // that require manual configuration
            needsInterop: needsInterop(
              config,
              ssr,
              id,
              idToExports[id],
              output,
            ),
          })
        }

        for (const o of Object.keys(meta.outputs)) {
          if (!o.match(jsMapExtensionRE)) {
            const id = path
              .relative(processingCacheDirOutputPath, o)
              .replace(jsExtensionRE, '')
            const file = getOptimizedDepPath(id, resolvedConfig, ssr)
            if (
              !findOptimizedDepInfoInRecord(
                metadata.optimized,
                (depInfo) => depInfo.file === file,
              )
            ) {
              addOptimizedDepInfo(metadata, 'chunks', {
                id,
                file,
                needsInterop: false,
                browserHash: metadata.browserHash,
              })
            }
          }
        }

        const dataPath = path.join(processingCacheDir, '_metadata.json')
        writeFile(
          dataPath,
          stringifyDepsOptimizerMetadata(metadata, depsCacheDir),
        )

        debug(`deps bundled in ${(performance.now() - start).toFixed(2)}ms`)

        return createProcessingResult()
      })
      .finally(() => {
        return disposeContext()
      })
  })

  result.catch(() => {
    cleanUp()
  })

  return {
    async cancel() {
      optimizerContext.cancelled = true
      const { context } = await preparedRun
      await context?.cancel()
      cleanUp()
    },
    result,
  }
}

async function prepareEsbuildOptimizerRun(
  resolvedConfig: ResolvedConfig,
  depsInfo: Record<string, OptimizedDepInfo>,
  ssr: boolean,
  processingCacheDir: string,
  optimizerContext: { cancelled: boolean },
): Promise<{
  context?: BuildContext
  idToExports: Record<string, ExportsData>
}> {
  const isBuild = resolvedConfig.command === 'build'
  const config: ResolvedConfig = {
    ...resolvedConfig,
    command: 'build',
  }

  // esbuild generates nested directory output with lowest common ancestor base
  // this is unpredictable and makes it difficult to analyze entry / output
  // mapping. So what we do here is:
  // 1. flatten all ids to eliminate slash
  // 2. in the plugin, read the entry ourselves as virtual files to retain the
  //    path.
  const flatIdDeps: Record<string, string> = {}
  const idToExports: Record<string, ExportsData> = {}
  const flatIdToExports: Record<string, ExportsData> = {}

  const optimizeDeps = getDepOptimizationConfig(config, ssr)

  const { plugins: pluginsFromConfig = [], ...esbuildOptions } =
    optimizeDeps?.esbuildOptions ?? {}

  for (const id in depsInfo) {
    const src = depsInfo[id].src!
    const exportsData = await (depsInfo[id].exportsData ??
      extractExportsData(src, config, ssr))
    if (exportsData.jsxLoader) {
      // Ensure that optimization won't fail by defaulting '.js' to the JSX parser.
      // This is useful for packages such as Gatsby.
      esbuildOptions.loader = {
        '.js': 'jsx',
        ...esbuildOptions.loader,
      }
    }
    const flatId = flattenId(id)
    flatIdDeps[flatId] = src
    idToExports[id] = exportsData
    flatIdToExports[flatId] = exportsData
  }

  if (optimizerContext.cancelled) return { context: undefined, idToExports }

  // esbuild automatically replaces process.env.NODE_ENV for platform 'browser'
  // In lib mode, we need to keep process.env.NODE_ENV untouched, so to at build
  // time we replace it by __vite_process_env_NODE_ENV. This placeholder will be
  // later replaced by the define plugin
  const define = {
    'process.env.NODE_ENV': isBuild
      ? '__vite_process_env_NODE_ENV'
      : JSON.stringify(process.env.NODE_ENV || config.mode),
  }

  const platform =
    ssr && config.ssr?.target !== 'webworker' ? 'node' : 'browser'

  const external = [...(optimizeDeps?.exclude ?? [])]

  if (isBuild) {
    let rollupOptionsExternal = config?.build?.rollupOptions?.external
    if (rollupOptionsExternal) {
      if (typeof rollupOptionsExternal === 'string') {
        rollupOptionsExternal = [rollupOptionsExternal]
      }
      // TODO: decide whether to support RegExp and function options
      // They're not supported yet because `optimizeDeps.exclude` currently only accepts strings
      if (
        !Array.isArray(rollupOptionsExternal) ||
        rollupOptionsExternal.some((ext) => typeof ext !== 'string')
      ) {
        throw new Error(
          `[vite] 'build.rollupOptions.external' can only be an array of strings or a string when using esbuild optimization at build time.`,
        )
      }
      external.push(...(rollupOptionsExternal as string[]))
    }
  }

  const plugins = [...pluginsFromConfig]
  if (external.length) {
    plugins.push(esbuildCjsExternalPlugin(external, platform))
  }
  plugins.push(esbuildDepPlugin(flatIdDeps, external, config, ssr))

  const context = await esbuild.context({
    absWorkingDir: process.cwd(),
    entryPoints: Object.keys(flatIdDeps),
    bundle: true,
    // We can't use platform 'neutral', as esbuild has custom handling
    // when the platform is 'node' or 'browser' that can't be emulated
    // by using mainFields and conditions
    platform,
    define,
    format: 'esm',
    // See https://github.com/evanw/esbuild/issues/1921#issuecomment-1152991694
    banner:
      platform === 'node'
        ? {
            js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
          }
        : undefined,
    target: isBuild ? config.build.target || undefined : ESBUILD_MODULES_TARGET,
    external,
    logLevel: 'error',
    splitting: true,
    sourcemap: true,
    outdir: processingCacheDir,
    ignoreAnnotations: !isBuild,
    metafile: true,
    plugins,
    charset: 'utf8',
    ...esbuildOptions,
    supported: {
      'dynamic-import': true,
      'import-meta': true,
      ...esbuildOptions.supported,
    },
  })
  return { context, idToExports }
}

export async function findKnownImports(
  config: ResolvedConfig,
  ssr: boolean,
): Promise<string[]> {
  const { deps } = await scanImports(config).result
  await addManuallyIncludedOptimizeDeps(deps, config, ssr)
  return Object.keys(deps)
}

export async function addManuallyIncludedOptimizeDeps(
  deps: Record<string, string>,
  config: ResolvedConfig,
  ssr: boolean,
  extra: string[] = [],
  filter?: (id: string) => boolean,
): Promise<void> {
  const { logger } = config
  const optimizeDeps = getDepOptimizationConfig(config, ssr)
  const optimizeDepsInclude = optimizeDeps?.include ?? []
  if (optimizeDepsInclude.length || extra.length) {
    const unableToOptimize = (id: string, msg: string) => {
      if (optimizeDepsInclude.includes(id)) {
        logger.warn(
          `${msg}: ${colors.cyan(id)}, present in '${
            ssr ? 'ssr.' : ''
          }optimizeDeps.include'`,
        )
      }
    }
    const resolve = config.createResolver({
      asSrc: false,
      scan: true,
      ssrOptimizeCheck: ssr,
      ssrConfig: config.ssr,
    })
    for (const id of [...optimizeDepsInclude, ...extra]) {
      // normalize 'foo   >bar` as 'foo > bar' to prevent same id being added
      // and for pretty printing
      const normalizedId = normalizeId(id)
      if (!deps[normalizedId] && filter?.(normalizedId) !== false) {
        const entry = await resolve(id, undefined, undefined, ssr)
        if (entry) {
          if (isOptimizable(entry, optimizeDeps)) {
            if (!entry.endsWith('?__vite_skip_optimization')) {
              deps[normalizedId] = entry
            }
          } else {
            unableToOptimize(id, 'Cannot optimize dependency')
          }
        } else {
          unableToOptimize(id, 'Failed to resolve dependency')
        }
      }
    }
  }
}

export function newDepOptimizationProcessing(): DepOptimizationProcessing {
  let resolve: () => void
  const promise = new Promise((_resolve) => {
    resolve = _resolve
  }) as Promise<void>
  return { promise, resolve: resolve! }
}

// Convert to { id: src }
export function depsFromOptimizedDepInfo(
  depsInfo: Record<string, OptimizedDepInfo>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(depsInfo).map((d) => [d[0], d[1].src!]),
  )
}

export function getOptimizedDepPath(
  id: string,
  config: ResolvedConfig,
  ssr: boolean,
): string {
  return normalizePath(
    path.resolve(getDepsCacheDir(config, ssr), flattenId(id) + '.js'),
  )
}

function getDepsCacheSuffix(config: ResolvedConfig, ssr: boolean): string {
  let suffix = ''
  if (config.command === 'build') {
    // Differentiate build caches depending on outDir to allow parallel builds
    const { outDir } = config.build
    const buildId =
      outDir.length > 8 || outDir.includes('/') ? getHash(outDir) : outDir
    suffix += `_build-${buildId}`
  }
  if (ssr) {
    suffix += '_ssr'
  }
  return suffix
}

export function getDepsCacheDir(config: ResolvedConfig, ssr: boolean): string {
  return getDepsCacheDirPrefix(config) + getDepsCacheSuffix(config, ssr)
}

function getProcessingDepsCacheDir(config: ResolvedConfig, ssr: boolean) {
  return (
    getDepsCacheDirPrefix(config) + getDepsCacheSuffix(config, ssr) + '_temp'
  )
}

export function getDepsCacheDirPrefix(config: ResolvedConfig): string {
  return normalizePath(path.resolve(config.cacheDir, 'deps'))
}

export function isOptimizedDepFile(
  id: string,
  config: ResolvedConfig,
): boolean {
  return id.startsWith(getDepsCacheDirPrefix(config))
}

export function createIsOptimizedDepUrl(
  config: ResolvedConfig,
): (url: string) => boolean {
  const { root } = config
  const depsCacheDir = getDepsCacheDirPrefix(config)

  // determine the url prefix of files inside cache directory
  const depsCacheDirRelative = normalizePath(path.relative(root, depsCacheDir))
  const depsCacheDirPrefix = depsCacheDirRelative.startsWith('../')
    ? // if the cache directory is outside root, the url prefix would be something
      // like '/@fs/absolute/path/to/node_modules/.vite'
      `/@fs/${normalizePath(depsCacheDir).replace(/^\//, '')}`
    : // if the cache directory is inside root, the url prefix would be something
      // like '/node_modules/.vite'
      `/${depsCacheDirRelative}`

  return function isOptimizedDepUrl(url: string): boolean {
    return url.startsWith(depsCacheDirPrefix)
  }
}

function parseDepsOptimizerMetadata(
  jsonMetadata: string,
  depsCacheDir: string,
): DepOptimizationMetadata | undefined {
  const { hash, browserHash, optimized, chunks } = JSON.parse(
    jsonMetadata,
    (key: string, value: string) => {
      // Paths can be absolute or relative to the deps cache dir where
      // the _metadata.json is located
      if (key === 'file' || key === 'src') {
        return normalizePath(path.resolve(depsCacheDir, value))
      }
      return value
    },
  )
  if (
    !chunks ||
    Object.values(optimized).some((depInfo: any) => !depInfo.fileHash)
  ) {
    // outdated _metadata.json version, ignore
    return
  }
  const metadata = {
    hash,
    browserHash,
    optimized: {},
    discovered: {},
    chunks: {},
    depInfoList: [],
  }
  for (const id of Object.keys(optimized)) {
    addOptimizedDepInfo(metadata, 'optimized', {
      ...optimized[id],
      id,
      browserHash,
    })
  }
  for (const id of Object.keys(chunks)) {
    addOptimizedDepInfo(metadata, 'chunks', {
      ...chunks[id],
      id,
      browserHash,
      needsInterop: false,
    })
  }
  return metadata
}

/**
 * Stringify metadata for deps cache. Remove processing promises
 * and individual dep info browserHash. Once the cache is reload
 * the next time the server start we need to use the global
 * browserHash to allow long term caching
 */
function stringifyDepsOptimizerMetadata(
  metadata: DepOptimizationMetadata,
  depsCacheDir: string,
) {
  const { hash, browserHash, optimized, chunks } = metadata
  return JSON.stringify(
    {
      hash,
      browserHash,
      optimized: Object.fromEntries(
        Object.values(optimized).map(
          ({ id, src, file, fileHash, needsInterop }) => [
            id,
            {
              src,
              file,
              fileHash,
              needsInterop,
            },
          ],
        ),
      ),
      chunks: Object.fromEntries(
        Object.values(chunks).map(({ id, file }) => [id, { file }]),
      ),
    },
    (key: string, value: string) => {
      // Paths can be absolute or relative to the deps cache dir where
      // the _metadata.json is located
      if (key === 'file' || key === 'src') {
        return normalizePath(path.relative(depsCacheDir, value))
      }
      return value
    },
    2,
  )
}

function esbuildOutputFromId(
  outputs: Record<string, any>,
  id: string,
  cacheDirOutputPath: string,
): any {
  const cwd = process.cwd()
  const flatId = flattenId(id) + '.js'
  const normalizedOutputPath = normalizePath(
    path.relative(cwd, path.join(cacheDirOutputPath, flatId)),
  )
  const output = outputs[normalizedOutputPath]
  if (output) {
    return output
  }
  // If the root dir was symlinked, esbuild could return output keys as `../cwd/`
  // Normalize keys to support this case too
  for (const [key, value] of Object.entries(outputs)) {
    if (normalizePath(path.relative(cwd, key)) === normalizedOutputPath) {
      return value
    }
  }
}

export async function extractExportsData(
  filePath: string,
  config: ResolvedConfig,
  ssr: boolean,
): Promise<ExportsData> {
  await init

  const optimizeDeps = getDepOptimizationConfig(config, ssr)

  const esbuildOptions = optimizeDeps?.esbuildOptions ?? {}
  if (optimizeDeps.extensions?.some((ext) => filePath.endsWith(ext))) {
    // For custom supported extensions, build the entry file to transform it into JS,
    // and then parse with es-module-lexer. Note that the `bundle` option is not `true`,
    // so only the entry file is being transformed.
    const result = await build({
      ...esbuildOptions,
      entryPoints: [filePath],
      write: false,
      format: 'esm',
    })
    const [imports, exports, facade] = parse(result.outputFiles[0].text)
    return {
      hasImports: imports.length > 0,
      exports: exports.map((e) => e.n),
      facade,
    }
  }

  let parseResult: ReturnType<typeof parse>
  let usedJsxLoader = false

  const entryContent = fs.readFileSync(filePath, 'utf-8')
  try {
    parseResult = parse(entryContent)
  } catch {
    const loader = esbuildOptions.loader?.[path.extname(filePath)] || 'jsx'
    debug(
      `Unable to parse: ${filePath}.\n Trying again with a ${loader} transform.`,
    )
    const transformed = await transformWithEsbuild(entryContent, filePath, {
      loader,
    })
    // Ensure that optimization won't fail by defaulting '.js' to the JSX parser.
    // This is useful for packages such as Gatsby.
    esbuildOptions.loader = {
      '.js': 'jsx',
      ...esbuildOptions.loader,
    }
    parseResult = parse(transformed.code)
    usedJsxLoader = true
  }

  const [imports, exports, facade] = parseResult
  const exportsData: ExportsData = {
    hasImports: imports.length > 0,
    exports: exports.map((e) => e.n),
    facade,
    hasReExports: imports.some(({ ss, se }) => {
      const exp = entryContent.slice(ss, se)
      return /export\s+\*\s+from/.test(exp)
    }),
    jsxLoader: usedJsxLoader,
  }
  return exportsData
}

function needsInterop(
  config: ResolvedConfig,
  ssr: boolean,
  id: string,
  exportsData: ExportsData,
  output?: { exports: string[] },
): boolean {
  if (getDepOptimizationConfig(config, ssr)?.needsInterop?.includes(id)) {
    return true
  }
  const { hasImports, exports } = exportsData
  // entry has no ESM syntax - likely CJS or UMD
  if (!exports.length && !hasImports) {
    return true
  }

  if (output) {
    // if a peer dependency used require() on an ESM dependency, esbuild turns the
    // ESM dependency's entry chunk into a single default export... detect
    // such cases by checking exports mismatch, and force interop.
    const generatedExports: string[] = output.exports

    if (
      !generatedExports ||
      (isSingleDefaultExport(generatedExports) &&
        !isSingleDefaultExport(exports))
    ) {
      return true
    }
  }
  return false
}

function isSingleDefaultExport(exports: readonly string[]) {
  return exports.length === 1 && exports[0] === 'default'
}

const lockfileFormats = [
  { name: 'package-lock.json', checkPatches: true },
  { name: 'yarn.lock', checkPatches: true }, // Included in lockfile for v2+
  { name: 'pnpm-lock.yaml', checkPatches: false }, // Included in lockfile
  { name: 'bun.lockb', checkPatches: true },
]

export function getDepHash(config: ResolvedConfig, ssr: boolean): string {
  const lockfilePath = lookupFile(
    config.root,
    lockfileFormats.map((l) => l.name),
    { pathOnly: true },
  )
  let content = lockfilePath ? fs.readFileSync(lockfilePath, 'utf-8') : ''
  if (lockfilePath) {
    const lockfileName = path.basename(lockfilePath)
    const { checkPatches } = lockfileFormats.find(
      (f) => f.name === lockfileName,
    )!
    if (checkPatches) {
      // Default of https://github.com/ds300/patch-package
      const fullPath = path.join(path.dirname(lockfilePath), 'patches')
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath)
        if (stats.isDirectory()) {
          content += stats.mtimeMs.toString()
        }
      }
    }
  }
  // also take config into account
  // only a subset of config options that can affect dep optimization
  const optimizeDeps = getDepOptimizationConfig(config, ssr)
  content += JSON.stringify(
    {
      mode: process.env.NODE_ENV || config.mode,
      root: config.root,
      resolve: config.resolve,
      buildTarget: config.build.target,
      assetsInclude: config.assetsInclude,
      plugins: config.plugins.map((p) => p.name),
      optimizeDeps: {
        include: optimizeDeps?.include,
        exclude: optimizeDeps?.exclude,
        esbuildOptions: {
          ...optimizeDeps?.esbuildOptions,
          plugins: optimizeDeps?.esbuildOptions?.plugins?.map((p) => p.name),
        },
      },
    },
    (_, value) => {
      if (typeof value === 'function' || value instanceof RegExp) {
        return value.toString()
      }
      return value
    },
  )
  return getHash(content)
}

function getOptimizedBrowserHash(
  hash: string,
  deps: Record<string, string>,
  timestamp = '',
) {
  return getHash(hash + JSON.stringify(deps) + timestamp)
}

export function optimizedDepInfoFromId(
  metadata: DepOptimizationMetadata,
  id: string,
): OptimizedDepInfo | undefined {
  return (
    metadata.optimized[id] || metadata.discovered[id] || metadata.chunks[id]
  )
}

export function optimizedDepInfoFromFile(
  metadata: DepOptimizationMetadata,
  file: string,
): OptimizedDepInfo | undefined {
  return metadata.depInfoList.find((depInfo) => depInfo.file === file)
}

function findOptimizedDepInfoInRecord(
  dependenciesInfo: Record<string, OptimizedDepInfo>,
  callbackFn: (depInfo: OptimizedDepInfo, id: string) => any,
): OptimizedDepInfo | undefined {
  for (const o of Object.keys(dependenciesInfo)) {
    const info = dependenciesInfo[o]
    if (callbackFn(info, o)) {
      return info
    }
  }
}

export async function optimizedDepNeedsInterop(
  metadata: DepOptimizationMetadata,
  file: string,
  config: ResolvedConfig,
  ssr: boolean,
): Promise<boolean | undefined> {
  const depInfo = optimizedDepInfoFromFile(metadata, file)
  if (depInfo?.src && depInfo.needsInterop === undefined) {
    depInfo.exportsData ??= extractExportsData(depInfo.src, config, ssr)
    depInfo.needsInterop = needsInterop(
      config,
      ssr,
      depInfo.id,
      await depInfo.exportsData,
    )
  }
  return depInfo?.needsInterop
}
