import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { performance } from 'node:perf_hooks'
import colors from 'picocolors'
import type { BuildContext, BuildOptions as EsbuildBuildOptions } from 'esbuild'
import esbuild, { build } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import glob from 'fast-glob'
import { createFilter } from '@rollup/pluginutils'
import { getDepOptimizationConfig } from '../config'
import type { ResolvedConfig } from '../config'
import {
  arraify,
  createDebugger,
  flattenId,
  getHash,
  isOptimizable,
  isWindows,
  lookupFile,
  normalizeId,
  normalizePath,
  removeLeadingSlash,
  tryStatSync,
} from '../utils'
import { transformWithEsbuild } from '../plugins/esbuild'
import { ESBUILD_MODULES_TARGET } from '../constants'
import { esbuildCjsExternalPlugin, esbuildDepPlugin } from './esbuildDepPlugin'
import { scanImports } from './scan'
import { createOptimizeDepsIncludeResolver, expandGlobIds } from './resolve'
export {
  initDepsOptimizer,
  initDevSsrDepsOptimizer,
  getDepsOptimizer,
} from './optimizer'

const debug = createDebugger('vite:deps')

const jsExtensionRE = /\.js$/i
const jsMapExtensionRE = /\.js\.map$/i

export type ExportsData = {
  hasImports: boolean
  // exported names (for `export { a as b }`, `b` is exported name)
  exports: readonly string[]
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
   * Forces ESM interop when importing these dependencies. Some legacy
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
  /**
   * Automatic dependency discovery. When `noDiscovery` is true, only dependencies
   * listed in `include` will be optimized. The scanner isn't run for cold start
   * in this case. CJS-only dependencies must be present in `include` during dev.
   * @default false
   * @experimental
   */
  noDiscovery?: boolean
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

  const cachedMetadata = await loadCachedDepOptimizationMetadata(
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
  log?.(colors.green(`Optimizing dependencies:\n  ${depsString}`))

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
  const cachedMetadata = await loadCachedDepOptimizationMetadata(
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

let firstLoadCachedDepOptimizationMetadata = true

/**
 * Creates the initial dep optimization metadata, loading it from the deps cache
 * if it exists and pre-bundling isn't forced
 */
export async function loadCachedDepOptimizationMetadata(
  config: ResolvedConfig,
  ssr: boolean,
  force = config.optimizeDeps.force,
  asCommand = false,
): Promise<DepOptimizationMetadata | undefined> {
  const log = asCommand ? config.logger.info : debug

  if (firstLoadCachedDepOptimizationMetadata) {
    firstLoadCachedDepOptimizationMetadata = false
    // Fire up a clean up of stale processing deps dirs if older process exited early
    setTimeout(() => cleanupDepsCacheStaleDirs(config), 0)
  }

  const depsCacheDir = getDepsCacheDir(config, ssr)

  if (!force) {
    let cachedMetadata: DepOptimizationMetadata | undefined
    try {
      const cachedMetadataPath = path.join(depsCacheDir, '_metadata.json')
      cachedMetadata = parseDepsOptimizerMetadata(
        await fsp.readFile(cachedMetadataPath, 'utf-8'),
        depsCacheDir,
      )
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (cachedMetadata && cachedMetadata.hash === getDepHash(config, ssr)) {
      log?.('Hash is consistent. Skipping. Use --force to override.')
      // Nothing to commit or cancel as we are using the cache, we only
      // need to resolve the processing promise so requests can move on
      return cachedMetadata
    }
  } else {
    config.logger.info('Forced re-optimization of dependencies')
  }

  // Start with a fresh cache
  debug?.(colors.green(`removing old cache dir ${depsCacheDir}`))
  await fsp.rm(depsCacheDir, { recursive: true, force: true })
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
  return colors.yellow(qualifiedIds.join(`, `))
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
  fs.mkdirSync(processingCacheDir, { recursive: true })

  // a hint for Node.js
  // all files in the cache directory should be recognized as ES modules
  debug?.(colors.green(`creating package.json in ${processingCacheDir}`))
  fs.writeFileSync(
    path.resolve(processingCacheDir, 'package.json'),
    `{\n  "type": "module"\n}\n`,
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
  let committed = false
  const cleanUp = () => {
    // If commit was already called, ignore the clean up even if a cancel was requested
    // This minimizes the chances of leaving the deps cache in a corrupted state
    if (!cleaned && !committed) {
      cleaned = true
      // No need to wait, we can clean up in the background because temp folders
      // are unique per run
      debug?.(colors.green(`removing cache dir ${processingCacheDir}`))
      fsp.rm(processingCacheDir, { recursive: true, force: true }).catch(() => {
        // Ignore errors
      })
    }
  }

  const successfulResult: DepOptimizationResult = {
    metadata,
    cancel: cleanUp,
    commit: async () => {
      if (cleaned) {
        throw new Error(
          'Can not commit a Deps Optimization run as it was cancelled',
        )
      }
      // Ignore clean up requests after this point so the temp folder isn't deleted before
      // we finish commiting the new deps cache files to the deps folder
      committed = true

      // Write metadata file, then commit the processing folder to the global deps cache
      // Rewire the file paths from the temporal processing dir to the final deps cache dir
      const dataPath = path.join(processingCacheDir, '_metadata.json')
      debug?.(colors.green(`creating _metadata.json in ${processingCacheDir}`))
      fs.writeFileSync(
        dataPath,
        stringifyDepsOptimizerMetadata(metadata, depsCacheDir),
      )

      // In order to minimize the time where the deps folder isn't in a consistent state,
      // we first rename the old depsCacheDir to a temporal path, then we rename the
      // new processing cache dir to the depsCacheDir. In systems where doing so in sync
      // is safe, we do an atomic operation (at least for this thread). For Windows, we
      // found there are cases where the rename operation may finish before it's done
      // so we do a graceful rename checking that the folder has been properly renamed.
      // We found that the rename-rename (then delete the old folder in the background)
      // is safer than a delete-rename operation.
      const temporalPath = depsCacheDir + getTempSuffix()
      const depsCacheDirPresent = fs.existsSync(depsCacheDir)
      if (isWindows) {
        if (depsCacheDirPresent) {
          debug?.(colors.green(`renaming ${depsCacheDir} to ${temporalPath}`))
          await safeRename(depsCacheDir, temporalPath)
        }
        debug?.(
          colors.green(`renaming ${processingCacheDir} to ${depsCacheDir}`),
        )
        await safeRename(processingCacheDir, depsCacheDir)
      } else {
        if (depsCacheDirPresent) {
          debug?.(colors.green(`renaming ${depsCacheDir} to ${temporalPath}`))
          fs.renameSync(depsCacheDir, temporalPath)
        }
        debug?.(
          colors.green(`renaming ${processingCacheDir} to ${depsCacheDir}`),
        )
        fs.renameSync(processingCacheDir, depsCacheDir)
      }

      // Delete temporal path in the background
      if (depsCacheDirPresent) {
        debug?.(colors.green(`removing cache temp dir ${temporalPath}`))
        fsp.rm(temporalPath, { recursive: true, force: true })
      }
    },
  }

  if (!qualifiedIds.length) {
    // No deps to optimize, we still commit the processing cache dir to remove
    // the previous optimized deps if they exist, and let the next server start
    // skip the scanner step if the lockfile hasn't changed
    return {
      cancel: async () => cleanUp(),
      result: Promise.resolve(successfulResult),
    }
  }

  const cancelledResult: DepOptimizationResult = {
    metadata,
    commit: async () => cleanUp(),
    cancel: cleanUp,
  }

  const start = performance.now()

  const preparedRun = prepareEsbuildOptimizerRun(
    resolvedConfig,
    depsInfo,
    ssr,
    processingCacheDir,
    optimizerContext,
  )

  const runResult = preparedRun.then(({ context, idToExports }) => {
    function disposeContext() {
      return context?.dispose().catch((e) => {
        config.logger.error('Failed to dispose esbuild context', { error: e })
      })
    }
    if (!context || optimizerContext.cancelled) {
      disposeContext()
      return cancelledResult
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

        debug?.(
          `Dependencies bundled in ${(performance.now() - start).toFixed(2)}ms`,
        )

        return successfulResult
      })

      .catch((e) => {
        if (e.errors && e.message.includes('The build was canceled')) {
          // esbuild logs an error when cancelling, but this is expected so
          // return an empty result instead
          return cancelledResult
        }
        throw e
      })
      .finally(() => {
        return disposeContext()
      })
  })

  runResult.catch(() => {
    cleanUp()
  })

  return {
    async cancel() {
      optimizerContext.cancelled = true
      const { context } = await preparedRun
      await context?.cancel()
      cleanUp()
    },
    result: runResult,
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

  const optimizeDeps = getDepOptimizationConfig(config, ssr)

  const { plugins: pluginsFromConfig = [], ...esbuildOptions } =
    optimizeDeps?.esbuildOptions ?? {}

  await Promise.all(
    Object.keys(depsInfo).map(async (id) => {
      const src = depsInfo[id].src!
      const exportsData = await (depsInfo[id].exportsData ??
        extractExportsData(src, config, ssr))
      if (exportsData.jsxLoader && !esbuildOptions.loader?.['.js']) {
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
    }),
  )

  if (optimizerContext.cancelled) return { context: undefined, idToExports }

  // esbuild automatically replaces process.env.NODE_ENV for platform 'browser'
  // But in lib mode, we need to keep process.env.NODE_ENV untouched
  const define = {
    'process.env.NODE_ENV':
      isBuild && config.build.lib
        ? 'process.env.NODE_ENV'
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

    const includes = [...optimizeDepsInclude, ...extra]
    for (let i = 0; i < includes.length; i++) {
      const id = includes[i]
      if (glob.isDynamicPattern(id)) {
        const globIds = expandGlobIds(id, config)
        includes.splice(i, 1, ...globIds)
        i += globIds.length - 1
      }
    }

    const resolve = createOptimizeDepsIncludeResolver(config, ssr)
    for (const id of includes) {
      // normalize 'foo   >bar` as 'foo > bar' to prevent same id being added
      // and for pretty printing
      const normalizedId = normalizeId(id)
      if (!deps[normalizedId] && filter?.(normalizedId) !== false) {
        const entry = await resolve(id)
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

// Convert to { id: src }
export function depsFromOptimizedDepInfo(
  depsInfo: Record<string, OptimizedDepInfo>,
): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const key in depsInfo) {
    obj[key] = depsInfo[key].src!
  }
  return obj
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
    getDepsCacheDirPrefix(config) +
    getDepsCacheSuffix(config, ssr) +
    getTempSuffix()
  )
}

function getTempSuffix() {
  return (
    '_temp_' +
    getHash(
      `${process.pid}:${Date.now().toString()}:${Math.random()
        .toString(16)
        .slice(2)}`,
    )
  )
}

function getDepsCacheDirPrefix(config: ResolvedConfig): string {
  return normalizePath(path.resolve(config.cacheDir, 'deps'))
}

export function createIsOptimizedDepFile(
  config: ResolvedConfig,
): (id: string) => boolean {
  const depsCacheDirPrefix = getDepsCacheDirPrefix(config)
  return (id) => id.startsWith(depsCacheDirPrefix)
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
      `/@fs/${removeLeadingSlash(normalizePath(depsCacheDir))}`
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
    const [imports, exports] = parse(result.outputFiles[0].text)
    return {
      hasImports: imports.length > 0,
      exports: exports.map((e) => e.n),
    }
  }

  let parseResult: ReturnType<typeof parse>
  let usedJsxLoader = false

  const entryContent = await fsp.readFile(filePath, 'utf-8')
  try {
    parseResult = parse(entryContent)
  } catch {
    const loader = esbuildOptions.loader?.[path.extname(filePath)] || 'jsx'
    debug?.(
      `Unable to parse: ${filePath}.\n Trying again with a ${loader} transform.`,
    )
    const transformed = await transformWithEsbuild(entryContent, filePath, {
      loader,
    })
    parseResult = parse(transformed.code)
    usedJsxLoader = true
  }

  const [imports, exports] = parseResult
  const exportsData: ExportsData = {
    hasImports: imports.length > 0,
    exports: exports.map((e) => e.n),
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
  { name: 'package-lock.json', checkPatches: true, manager: 'npm' },
  { name: 'yarn.lock', checkPatches: true, manager: 'yarn' }, // Included in lockfile for v2+
  { name: 'pnpm-lock.yaml', checkPatches: false, manager: 'pnpm' }, // Included in lockfile
  { name: 'bun.lockb', checkPatches: true, manager: 'bun' },
].sort((_, { manager }) => {
  return process.env.npm_config_user_agent?.startsWith(manager) ? 1 : -1
})
const lockfileNames = lockfileFormats.map((l) => l.name)

export function getDepHash(config: ResolvedConfig, ssr: boolean): string {
  const lockfilePath = lookupFile(config.root, lockfileNames)
  let content = lockfilePath ? fs.readFileSync(lockfilePath, 'utf-8') : ''
  if (lockfilePath) {
    const lockfileName = path.basename(lockfilePath)
    const { checkPatches } = lockfileFormats.find(
      (f) => f.name === lockfileName,
    )!
    if (checkPatches) {
      // Default of https://github.com/ds300/patch-package
      const fullPath = path.join(path.dirname(lockfilePath), 'patches')
      const stat = tryStatSync(fullPath)
      if (stat?.isDirectory()) {
        content += stat.mtimeMs.toString()
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

const MAX_TEMP_DIR_AGE_MS = 24 * 60 * 60 * 1000
export async function cleanupDepsCacheStaleDirs(
  config: ResolvedConfig,
): Promise<void> {
  try {
    const cacheDir = path.resolve(config.cacheDir)
    if (fs.existsSync(cacheDir)) {
      const dirents = await fsp.readdir(cacheDir, { withFileTypes: true })
      for (const dirent of dirents) {
        if (dirent.isDirectory() && dirent.name.includes('_temp_')) {
          const tempDirPath = path.resolve(config.cacheDir, dirent.name)
          const stats = await fsp.stat(tempDirPath).catch((_) => null)
          if (
            stats?.mtime &&
            Date.now() - stats.mtime.getTime() > MAX_TEMP_DIR_AGE_MS
          ) {
            debug?.(`removing stale cache temp dir ${tempDirPath}`)
            await fsp.rm(tempDirPath, { recursive: true, force: true })
          }
        }
      }
    }
  } catch (err) {
    config.logger.error(err)
  }
}

// We found issues with renaming folders in some systems. This is a custom
// implementation for the optimizer. It isn't intended to be a general utility

// Based on node-graceful-fs

// The ISC License
// Copyright (c) 2011-2022 Isaac Z. Schlueter, Ben Noordhuis, and Contributors
// https://github.com/isaacs/node-graceful-fs/blob/main/LICENSE

// On Windows, A/V software can lock the directory, causing this
// to fail with an EACCES or EPERM if the directory contains newly
// created files. The original tried for up to 60 seconds, we only
// wait for 5 seconds, as a longer time would be seen as an error

const GRACEFUL_RENAME_TIMEOUT = 5000
const safeRename = promisify(function gracefulRename(
  from: string,
  to: string,
  cb: (error: NodeJS.ErrnoException | null) => void,
) {
  const start = Date.now()
  let backoff = 0
  fs.rename(from, to, function CB(er) {
    if (
      er &&
      (er.code === 'EACCES' || er.code === 'EPERM') &&
      Date.now() - start < GRACEFUL_RENAME_TIMEOUT
    ) {
      setTimeout(function () {
        fs.stat(to, function (stater, st) {
          if (stater && stater.code === 'ENOENT') fs.rename(from, to, CB)
          else CB(er)
        })
      }, backoff)
      if (backoff < 100) backoff += 10
      return
    }
    if (cb) cb(er)
  })
})
