import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { performance } from 'node:perf_hooks'
import colors from 'picocolors'
import type { BuildContext, BuildOptions as EsbuildBuildOptions } from 'esbuild'
import esbuild, { build } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import { isDynamicPattern } from 'tinyglobby'
import type { ResolvedConfig } from '../config'
import {
  createDebugger,
  flattenId,
  getHash,
  isOptimizable,
  lookupFile,
  normalizeId,
  normalizePath,
  removeLeadingSlash,
  tryStatSync,
  unique,
} from '../utils'
import {
  defaultEsbuildSupported,
  transformWithEsbuild,
} from '../plugins/esbuild'
import { ESBUILD_MODULES_TARGET, METADATA_FILENAME } from '../constants'
import { isWindows } from '../../shared/utils'
import type { Environment } from '../environment'
import { esbuildCjsExternalPlugin, esbuildDepPlugin } from './esbuildDepPlugin'
import { ScanEnvironment, scanImports } from './scan'
import { createOptimizeDepsIncludeResolver, expandGlobIds } from './resolve'

const debug = createDebugger('vite:deps')

const jsExtensionRE = /\.js$/i
const jsMapExtensionRE = /\.js\.map$/i

export type ExportsData = {
  hasModuleSyntax: boolean
  // exported names (for `export { a as b }`, `b` is exported name)
  exports: readonly string[]
  // hint if the dep requires loading as jsx
  jsxLoader?: boolean
}

export interface DepsOptimizer {
  init: () => Promise<void>

  metadata: DepOptimizationMetadata
  scanProcessing?: Promise<void>
  registerMissingImport: (id: string, resolved: string) => OptimizedDepInfo
  run: () => void

  isOptimizedDepFile: (id: string) => boolean
  isOptimizedDepUrl: (url: string) => boolean
  getOptimizedDepId: (depInfo: OptimizedDepInfo) => string

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
   * Deps optimization during build was removed in Vite 5.1. This option is
   * now redundant and will be removed in a future version. Switch to using
   * `optimizeDeps.noDiscovery` and an empty or undefined `optimizeDeps.include`.
   * true or 'dev' disables the optimizer, false or 'build' leaves it enabled.
   * @default 'build'
   * @deprecated
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
  /**
   * When enabled, it will hold the first optimized deps results until all static
   * imports are crawled on cold start. This avoids the need for full-page reloads
   * when new dependencies are discovered and they trigger the generation of new
   * common chunks. If all dependencies are found by the scanner plus the explicitly
   * defined ones in `include`, it is better to disable this option to let the
   * browser process more requests in parallel.
   * @default true
   * @experimental
   */
  holdUntilCrawlEnd?: boolean
}

export type DepOptimizationOptions = DepOptimizationConfig & {
  /**
   * By default, Vite will crawl your `index.html` to detect dependencies that
   * need to be pre-bundled. If `build.rollupOptions.input` is specified, Vite
   * will crawl those entry points instead.
   *
   * If neither of these fit your needs, you can specify custom entries using
   * this option - the value should be a tinyglobby pattern or array of patterns
   * (https://github.com/SuperchupuDev/tinyglobby) that are relative from
   * vite project root. This will overwrite default entries inference.
   */
  entries?: string | string[]
  /**
   * Force dep pre-optimization regardless of whether deps have changed.
   * @experimental
   */
  force?: boolean
}

export function isDepOptimizationDisabled(
  optimizeDeps: DepOptimizationOptions,
): boolean {
  return (
    optimizeDeps.disabled === true ||
    optimizeDeps.disabled === 'dev' ||
    (!!optimizeDeps.noDiscovery && !optimizeDeps.include?.length)
  )
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
   * This hash is determined by dependency lockfiles.
   * This is checked on server startup to avoid unnecessary re-bundles.
   */
  lockfileHash: string
  /**
   * This hash is determined by user config.
   * This is checked on server startup to avoid unnecessary re-bundles.
   */
  configHash: string
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

  const environment = new ScanEnvironment('client', config)
  await environment.init()

  const cachedMetadata = await loadCachedDepOptimizationMetadata(
    environment,
    force,
    asCommand,
  )
  if (cachedMetadata) {
    return cachedMetadata
  }

  const deps = await discoverProjectDependencies(environment).result

  await addManuallyIncludedOptimizeDeps(environment, deps)

  const depsString = depsLogString(Object.keys(deps))
  log?.(colors.green(`Optimizing dependencies:\n  ${depsString}`))

  const depsInfo = toDiscoveredDependencies(environment, deps)

  const result = await runOptimizeDeps(environment, depsInfo).result

  await result.commit()

  return result.metadata
}

export async function optimizeExplicitEnvironmentDeps(
  environment: Environment,
): Promise<DepOptimizationMetadata> {
  const cachedMetadata = await loadCachedDepOptimizationMetadata(
    environment,
    environment.config.optimizeDeps.force ?? false,
    false,
  )
  if (cachedMetadata) {
    return cachedMetadata
  }

  const deps: Record<string, string> = {}

  await addManuallyIncludedOptimizeDeps(environment, deps)

  const depsInfo = toDiscoveredDependencies(environment, deps)

  const result = await runOptimizeDeps(environment, depsInfo).result

  await result.commit()

  return result.metadata
}

export function initDepsOptimizerMetadata(
  environment: Environment,
  timestamp?: string,
): DepOptimizationMetadata {
  const { lockfileHash, configHash, hash } = getDepHash(environment)
  return {
    hash,
    lockfileHash,
    configHash,
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
  environment: Environment,
  force = environment.config.optimizeDeps.force ?? false,
  asCommand = false,
): Promise<DepOptimizationMetadata | undefined> {
  const log = asCommand ? environment.logger.info : debug

  if (firstLoadCachedDepOptimizationMetadata) {
    firstLoadCachedDepOptimizationMetadata = false
    // Fire up a clean up of stale processing deps dirs if older process exited early
    setTimeout(
      () => cleanupDepsCacheStaleDirs(environment.getTopLevelConfig()),
      0,
    )
  }

  const depsCacheDir = getDepsCacheDir(environment)

  if (!force) {
    let cachedMetadata: DepOptimizationMetadata | undefined
    try {
      const cachedMetadataPath = path.join(depsCacheDir, METADATA_FILENAME)
      cachedMetadata = parseDepsOptimizerMetadata(
        await fsp.readFile(cachedMetadataPath, 'utf-8'),
        depsCacheDir,
      )
    } catch {}
    // hash is consistent, no need to re-bundle
    if (cachedMetadata) {
      if (cachedMetadata.lockfileHash !== getLockfileHash(environment)) {
        environment.logger.info(
          'Re-optimizing dependencies because lockfile has changed',
        )
      } else if (cachedMetadata.configHash !== getConfigHash(environment)) {
        environment.logger.info(
          'Re-optimizing dependencies because vite config has changed',
        )
      } else {
        log?.('Hash is consistent. Skipping. Use --force to override.')
        // Nothing to commit or cancel as we are using the cache, we only
        // need to resolve the processing promise so requests can move on
        return cachedMetadata
      }
    }
  } else {
    environment.logger.info('Forced re-optimization of dependencies')
  }

  // Start with a fresh cache
  debug?.(colors.green(`removing old cache dir ${depsCacheDir}`))
  await fsp.rm(depsCacheDir, { recursive: true, force: true })
}

/**
 * Initial optimizeDeps at server start. Perform a fast scan using esbuild to
 * find deps to pre-bundle and include user hard-coded dependencies
 */
export function discoverProjectDependencies(environment: ScanEnvironment): {
  cancel: () => Promise<void>
  result: Promise<Record<string, string>>
} {
  const { cancel, result } = scanImports(environment)

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
  environment: Environment,
  deps: Record<string, string>,
  timestamp?: string,
): Record<string, OptimizedDepInfo> {
  const browserHash = getOptimizedBrowserHash(
    getDepHash(environment).hash,
    deps,
    timestamp,
  )
  const discovered: Record<string, OptimizedDepInfo> = {}
  for (const id in deps) {
    const src = deps[id]
    discovered[id] = {
      id,
      file: getOptimizedDepPath(environment, id),
      src,
      browserHash: browserHash,
      exportsData: extractExportsData(environment, src),
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
  environment: Environment,
  depsInfo: Record<string, OptimizedDepInfo>,
): {
  cancel: () => Promise<void>
  result: Promise<DepOptimizationResult>
} {
  const optimizerContext = { cancelled: false }

  const depsCacheDir = getDepsCacheDir(environment)
  const processingCacheDir = getProcessingDepsCacheDir(environment)

  // Create a temporary directory so we don't need to delete optimized deps
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

  const metadata = initDepsOptimizerMetadata(environment)

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
      try {
        // When exiting the process, `fsp.rm` may not take effect, so we use `fs.rmSync`
        fs.rmSync(processingCacheDir, { recursive: true, force: true })
      } catch {
        // Ignore errors
      }
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
      // we finish committing the new deps cache files to the deps folder
      committed = true

      // Write metadata file, then commit the processing folder to the global deps cache
      // Rewire the file paths from the temporary processing dir to the final deps cache dir
      const dataPath = path.join(processingCacheDir, METADATA_FILENAME)
      debug?.(
        colors.green(`creating ${METADATA_FILENAME} in ${processingCacheDir}`),
      )
      fs.writeFileSync(
        dataPath,
        stringifyDepsOptimizerMetadata(metadata, depsCacheDir),
      )

      // In order to minimize the time where the deps folder isn't in a consistent state,
      // we first rename the old depsCacheDir to a temporary path, then we rename the
      // new processing cache dir to the depsCacheDir. In systems where doing so in sync
      // is safe, we do an atomic operation (at least for this thread). For Windows, we
      // found there are cases where the rename operation may finish before it's done
      // so we do a graceful rename checking that the folder has been properly renamed.
      // We found that the rename-rename (then delete the old folder in the background)
      // is safer than a delete-rename operation.
      const temporaryPath = depsCacheDir + getTempSuffix()
      const depsCacheDirPresent = fs.existsSync(depsCacheDir)
      if (isWindows) {
        if (depsCacheDirPresent) {
          debug?.(colors.green(`renaming ${depsCacheDir} to ${temporaryPath}`))
          await safeRename(depsCacheDir, temporaryPath)
        }
        debug?.(
          colors.green(`renaming ${processingCacheDir} to ${depsCacheDir}`),
        )
        await safeRename(processingCacheDir, depsCacheDir)
      } else {
        if (depsCacheDirPresent) {
          debug?.(colors.green(`renaming ${depsCacheDir} to ${temporaryPath}`))
          fs.renameSync(depsCacheDir, temporaryPath)
        }
        debug?.(
          colors.green(`renaming ${processingCacheDir} to ${depsCacheDir}`),
        )
        fs.renameSync(processingCacheDir, depsCacheDir)
      }

      // Delete temporary path in the background
      if (depsCacheDirPresent) {
        debug?.(colors.green(`removing cache temp dir ${temporaryPath}`))
        fsp.rm(temporaryPath, { recursive: true, force: true })
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
    environment,
    depsInfo,
    processingCacheDir,
    optimizerContext,
  )

  const runResult = preparedRun.then(({ context, idToExports }) => {
    function disposeContext() {
      return context?.dispose().catch((e) => {
        environment.logger.error('Failed to dispose esbuild context', {
          error: e,
        })
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
              environment,
              id,
              idToExports[id],
              output,
            ),
          })
        }

        for (const o of Object.keys(meta.outputs)) {
          if (!jsMapExtensionRE.test(o)) {
            const id = path
              .relative(processingCacheDirOutputPath, o)
              .replace(jsExtensionRE, '')
            const file = getOptimizedDepPath(environment, id)
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
          } else {
            // workaround Firefox warning by removing blank source map reference
            // https://github.com/evanw/esbuild/issues/3945
            const output = meta.outputs[o]
            // filter by exact bytes of an empty source map
            if (output.bytes === 93) {
              const jsMapPath = path.resolve(o)
              const jsPath = jsMapPath.slice(0, -4)
              if (fs.existsSync(jsPath) && fs.existsSync(jsMapPath)) {
                const map = JSON.parse(fs.readFileSync(jsMapPath, 'utf-8'))
                if (map.sources.length === 0) {
                  const js = fs.readFileSync(jsPath, 'utf-8')
                  fs.writeFileSync(
                    jsPath,
                    js.slice(0, js.lastIndexOf('//# sourceMappingURL=')),
                  )
                }
              }
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
  environment: Environment,
  depsInfo: Record<string, OptimizedDepInfo>,
  processingCacheDir: string,
  optimizerContext: { cancelled: boolean },
): Promise<{
  context?: BuildContext
  idToExports: Record<string, ExportsData>
}> {
  // esbuild generates nested directory output with lowest common ancestor base
  // this is unpredictable and makes it difficult to analyze entry / output
  // mapping. So what we do here is:
  // 1. flatten all ids to eliminate slash
  // 2. in the plugin, read the entry ourselves as virtual files to retain the
  //    path.
  const flatIdDeps: Record<string, string> = {}
  const idToExports: Record<string, ExportsData> = {}

  const { optimizeDeps } = environment.config

  const { plugins: pluginsFromConfig = [], ...esbuildOptions } =
    optimizeDeps.esbuildOptions ?? {}

  await Promise.all(
    Object.keys(depsInfo).map(async (id) => {
      const src = depsInfo[id].src!
      const exportsData = await (depsInfo[id].exportsData ??
        extractExportsData(environment, src))
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

  const define = {
    'process.env.NODE_ENV': environment.config.keepProcessEnv
      ? // define process.env.NODE_ENV even for keepProcessEnv === true
        // as esbuild will replace it automatically when `platform` is `'browser'`
        'process.env.NODE_ENV'
      : JSON.stringify(process.env.NODE_ENV || environment.config.mode),
  }

  const platform =
    optimizeDeps.esbuildOptions?.platform ??
    // We generally don't want to use platform 'neutral', as esbuild has custom handling
    // when the platform is 'node' or 'browser' that can't be emulated by using mainFields
    // and conditions
    (environment.config.consumer === 'client' ||
    environment.config.ssr.target === 'webworker'
      ? 'browser'
      : 'node')

  const external = [...(optimizeDeps.exclude ?? [])]

  const plugins = [...pluginsFromConfig]
  if (external.length) {
    plugins.push(esbuildCjsExternalPlugin(external, platform))
  }
  plugins.push(esbuildDepPlugin(environment, flatIdDeps, external))

  const context = await esbuild.context({
    absWorkingDir: process.cwd(),
    entryPoints: Object.keys(flatIdDeps),
    bundle: true,
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
    target: ESBUILD_MODULES_TARGET,
    external,
    logLevel: 'error',
    splitting: true,
    sourcemap: true,
    outdir: processingCacheDir,
    ignoreAnnotations: true,
    metafile: true,
    plugins,
    charset: 'utf8',
    ...esbuildOptions,
    supported: {
      ...defaultEsbuildSupported,
      ...esbuildOptions.supported,
    },
  })
  return { context, idToExports }
}

export async function addManuallyIncludedOptimizeDeps(
  environment: Environment,
  deps: Record<string, string>,
): Promise<void> {
  const { logger } = environment
  const { optimizeDeps } = environment.config
  const optimizeDepsInclude = optimizeDeps.include ?? []
  if (optimizeDepsInclude.length) {
    const unableToOptimize = (id: string, msg: string) => {
      if (optimizeDepsInclude.includes(id)) {
        logger.warn(
          `${msg}: ${colors.cyan(id)}, present in ${environment.name} 'optimizeDeps.include'`,
        )
      }
    }

    const includes = [...optimizeDepsInclude]
    for (let i = 0; i < includes.length; i++) {
      const id = includes[i]
      if (isDynamicPattern(id)) {
        const globIds = expandGlobIds(id, environment.getTopLevelConfig())
        includes.splice(i, 1, ...globIds)
        i += globIds.length - 1
      }
    }

    const resolve = createOptimizeDepsIncludeResolver(environment)
    for (const id of includes) {
      // normalize 'foo   >bar` as 'foo > bar' to prevent same id being added
      // and for pretty printing
      const normalizedId = normalizeId(id)
      if (!deps[normalizedId]) {
        const entry = await resolve(id)
        if (entry) {
          if (isOptimizable(entry, optimizeDeps)) {
            deps[normalizedId] = entry
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
  environment: Environment,
  id: string,
): string {
  return normalizePath(
    path.resolve(getDepsCacheDir(environment), flattenId(id) + '.js'),
  )
}

function getDepsCacheSuffix(environment: Environment): string {
  return environment.name === 'client' ? '' : `_${environment.name}`
}

export function getDepsCacheDir(environment: Environment): string {
  return getDepsCacheDirPrefix(environment) + getDepsCacheSuffix(environment)
}

function getProcessingDepsCacheDir(environment: Environment) {
  return (
    getDepsCacheDirPrefix(environment) +
    getDepsCacheSuffix(environment) +
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

function getDepsCacheDirPrefix(environment: Environment): string {
  return normalizePath(path.resolve(environment.config.cacheDir, 'deps'))
}

export function createIsOptimizedDepFile(
  environment: Environment,
): (id: string) => boolean {
  const depsCacheDirPrefix = getDepsCacheDirPrefix(environment)
  return (id) => id.startsWith(depsCacheDirPrefix)
}

export function createIsOptimizedDepUrl(
  environment: Environment,
): (url: string) => boolean {
  const { root } = environment.config
  const depsCacheDir = getDepsCacheDirPrefix(environment)

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
  const { hash, lockfileHash, configHash, browserHash, optimized, chunks } =
    JSON.parse(jsonMetadata, (key: string, value: string) => {
      // Paths can be absolute or relative to the deps cache dir where
      // the _metadata.json is located
      if (key === 'file' || key === 'src') {
        return normalizePath(path.resolve(depsCacheDir, value))
      }
      return value
    })
  if (
    !chunks ||
    Object.values(optimized).some((depInfo: any) => !depInfo.fileHash)
  ) {
    // outdated _metadata.json version, ignore
    return
  }
  const metadata = {
    hash,
    lockfileHash,
    configHash,
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
  const { hash, configHash, lockfileHash, browserHash, optimized, chunks } =
    metadata
  return JSON.stringify(
    {
      hash,
      configHash,
      lockfileHash,
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
  environment: Environment,
  filePath: string,
): Promise<ExportsData> {
  await init

  const { optimizeDeps } = environment.config

  const esbuildOptions = optimizeDeps.esbuildOptions ?? {}
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
    const [, exports, , hasModuleSyntax] = parse(result.outputFiles[0].text)
    return {
      hasModuleSyntax,
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
    const transformed = await transformWithEsbuild(
      entryContent,
      filePath,
      { loader },
      undefined,
      environment.config,
    )
    parseResult = parse(transformed.code)
    usedJsxLoader = true
  }

  const [, exports, , hasModuleSyntax] = parseResult
  const exportsData: ExportsData = {
    hasModuleSyntax,
    exports: exports.map((e) => e.n),
    jsxLoader: usedJsxLoader,
  }
  return exportsData
}

function needsInterop(
  environment: Environment,
  id: string,
  exportsData: ExportsData,
  output?: { exports: string[] },
): boolean {
  if (environment.config.optimizeDeps.needsInterop?.includes(id)) {
    return true
  }
  const { hasModuleSyntax, exports } = exportsData
  // entry has no ESM syntax - likely CJS or UMD
  if (!hasModuleSyntax) {
    return true
  }

  if (output) {
    // if a peer dependency used require() on an ESM dependency, esbuild turns the
    // ESM dependency's entry chunk into a single default export... detect
    // such cases by checking exports mismatch, and force interop.
    const generatedExports: string[] = output.exports

    if (
      isSingleDefaultExport(generatedExports) &&
      !isSingleDefaultExport(exports)
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
  {
    path: 'node_modules/.package-lock.json',
    checkPatchesDir: 'patches',
    manager: 'npm',
  },
  {
    // Yarn non-PnP
    path: 'node_modules/.yarn-state.yml',
    checkPatchesDir: false,
    manager: 'yarn',
  },
  {
    // Yarn v3+ PnP
    path: '.pnp.cjs',
    checkPatchesDir: '.yarn/patches',
    manager: 'yarn',
  },
  {
    // Yarn v2 PnP
    path: '.pnp.js',
    checkPatchesDir: '.yarn/patches',
    manager: 'yarn',
  },
  {
    // yarn 1
    path: 'node_modules/.yarn-integrity',
    checkPatchesDir: 'patches',
    manager: 'yarn',
  },
  {
    path: 'node_modules/.pnpm/lock.yaml',
    // Included in lockfile
    checkPatchesDir: false,
    manager: 'pnpm',
  },
  {
    path: 'bun.lockb',
    checkPatchesDir: 'patches',
    manager: 'bun',
  },
].sort((_, { manager }) => {
  return process.env.npm_config_user_agent?.startsWith(manager) ? 1 : -1
})
const lockfilePaths = lockfileFormats.map((l) => l.path)

function getConfigHash(environment: Environment): string {
  // Take config into account
  // only a subset of config options that can affect dep optimization
  const { config } = environment
  const { optimizeDeps } = config
  const content = JSON.stringify(
    {
      define: !config.keepProcessEnv
        ? process.env.NODE_ENV || config.mode
        : null,
      root: config.root,
      resolve: config.resolve,
      assetsInclude: config.assetsInclude,
      plugins: config.plugins.map((p) => p.name),
      optimizeDeps: {
        include: optimizeDeps.include
          ? unique(optimizeDeps.include).sort()
          : undefined,
        exclude: optimizeDeps.exclude
          ? unique(optimizeDeps.exclude).sort()
          : undefined,
        esbuildOptions: {
          ...optimizeDeps.esbuildOptions,
          plugins: optimizeDeps.esbuildOptions?.plugins?.map((p) => p.name),
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

function getLockfileHash(environment: Environment): string {
  const lockfilePath = lookupFile(environment.config.root, lockfilePaths)
  let content = lockfilePath ? fs.readFileSync(lockfilePath, 'utf-8') : ''
  if (lockfilePath) {
    const normalizedLockfilePath = lockfilePath.replaceAll('\\', '/')
    const lockfileFormat = lockfileFormats.find((f) =>
      normalizedLockfilePath.endsWith(f.path),
    )!
    if (lockfileFormat.checkPatchesDir) {
      // Default of https://github.com/ds300/patch-package
      const baseDir = lockfilePath.slice(0, -lockfileFormat.path.length)
      const fullPath = path.join(
        baseDir,
        lockfileFormat.checkPatchesDir as string,
      )
      const stat = tryStatSync(fullPath)
      if (stat?.isDirectory()) {
        content += stat.mtimeMs.toString()
      }
    }
  }
  return getHash(content)
}

function getDepHash(environment: Environment): {
  lockfileHash: string
  configHash: string
  hash: string
} {
  const lockfileHash = getLockfileHash(environment)
  const configHash = getConfigHash(environment)
  const hash = getHash(lockfileHash + configHash)
  return {
    hash,
    lockfileHash,
    configHash,
  }
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
  environment: Environment,
  metadata: DepOptimizationMetadata,
  file: string,
): Promise<boolean | undefined> {
  const depInfo = optimizedDepInfoFromFile(metadata, file)
  if (depInfo?.src && depInfo.needsInterop === undefined) {
    depInfo.exportsData ??= extractExportsData(environment, depInfo.src)
    depInfo.needsInterop = needsInterop(
      environment,
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
          const stats = await fsp.stat(tempDirPath).catch(() => null)
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
        fs.stat(to, function (stater, _st) {
          if (stater && stater.code === 'ENOENT') fs.rename(from, to, CB)
          else CB(er)
        })
      }, backoff)
      if (backoff < 100) backoff += 10
      return
    }
    cb(er)
  })
})
