import fs from 'fs'
import path from 'path'
import colors from 'picocolors'
import { createHash } from 'crypto'
import type { BuildOptions as EsbuildBuildOptions } from 'esbuild'
import { build } from 'esbuild'
import type { ResolvedConfig } from '../config'
import {
  createDebugger,
  emptyDir,
  lookupFile,
  normalizePath,
  writeFile,
  flattenId,
  normalizeId
} from '../utils'
import { esbuildDepPlugin } from './esbuildDepPlugin'
import { init, parse } from 'es-module-lexer'
import { scanImports } from './scan'
import { transformWithEsbuild } from '../plugins/esbuild'
import { performance } from 'perf_hooks'

const debug = createDebugger('vite:deps')

export type ExportsData = ReturnType<typeof parse> & {
  // es-module-lexer has a facade detection but isn't always accurate for our
  // use case when the module has default export
  hasReExports?: true
}

export interface DepOptimizationOptions {
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
   * Options to pass to esbuild during the dep scanning and optimization
   *
   * Certain options are omitted since changing them would not be compatible
   * with Vite's dep optimization.
   *
   * - `external` is also omitted, use Vite's `optimizeDeps.exclude` option
   * - `plugins` are merged with Vite's dep plugin
   * - `keepNames` takes precedence over the deprecated `optimizeDeps.keepNames`
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
   * @deprecated use `esbuildOptions.keepNames`
   */
  keepNames?: boolean
  /**
   * List of file extensions that can be optimized. A corresponding esbuild
   * plugin must exist to handle the specific extension.
   *
   * By default, Vite can optimize `.mjs`, `.js`, and `.ts` files. This option
   * allows specifying additional extensions.
   *
   * @experimental
   */
  extensions?: string[]
}

export interface DepOptimizationResult {
  /**
   * After a re-optimization, the internal bundled chunks may change
   * and a full page reload is required if that is the case
   * If the files are stable, we can avoid the reload that is expensive
   * for large applications
   */
  alteredFiles: boolean
}

export interface DepOptimizationProcessing {
  promise: Promise<DepOptimizationResult | undefined>
  resolve: (result?: DepOptimizationResult) => void
}

export interface OptimizedDepInfo {
  file: string
  src: string
  needsInterop?: boolean
  browserHash?: string
  fileHash?: string
  /**
   * During optimization, ids can still be resolved to their final location
   * but the bundles may not yet be saved to disk
   */
  processing: Promise<DepOptimizationResult | undefined>
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
   * Metadata for each newly discovered dependency after processing
   */
  discovered: Record<string, OptimizedDepInfo>
  /**
   * During optimization, ids can still be resolved to their final location
   * but the bundles may not yet be saved to disk
   */
  processing: Promise<DepOptimizationResult | undefined>
}

/**
 * Used by Vite CLI when running `vite optimize`
 */
export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false,
  newDeps?: Record<string, OptimizedDepInfo>, // missing imports encountered after server has started
  ssr?: boolean
): Promise<DepOptimizationMetadata> {
  const { metadata, run } = await createOptimizeDepsRun(
    config,
    force,
    asCommand,
    null,
    newDeps,
    ssr
  )
  await run()
  return metadata
}

/**
 * Internally, Vite uses this function to prepare a optimizeDeps run. When Vite starts, we can get
 * the metadata and start the server without waiting for the optimizeDeps processing to be completed
 */
export async function createOptimizeDepsRun(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false,
  currentData: DepOptimizationMetadata | null = null,
  newDeps?: Record<string, OptimizedDepInfo>, // missing imports encountered after server has started
  ssr?: boolean
): Promise<{
  metadata: DepOptimizationMetadata
  run: () => Promise<DepOptimizationResult | undefined>
}> {
  config = {
    ...config,
    command: 'build'
  }

  const { root, logger } = config
  const log = asCommand ? logger.info : debug

  // Before Vite 2.9, dependencies were cached in the root of the cacheDir
  // For compat, we remove the cache if we find the old structure
  if (fs.existsSync(path.join(config.cacheDir, '_metadata.json'))) {
    emptyDir(config.cacheDir)
  }

  const depsCacheDir = getDepsCacheDir(config)
  const processingCacheDir = getProcessingDepsCacheDir(config)

  const mainHash = getDepHash(root, config)

  const processing = newDepOptimizationProcessing()

  const metadata: DepOptimizationMetadata = {
    hash: mainHash,
    browserHash: mainHash,
    optimized: {},
    discovered: {},
    processing: processing.promise
  }

  if (!force) {
    let prevData: DepOptimizationMetadata | undefined
    try {
      const prevDataPath = path.join(depsCacheDir, '_metadata.json')
      prevData = parseOptimizedDepsMetadata(
        fs.readFileSync(prevDataPath, 'utf-8'),
        depsCacheDir,
        processing.promise
      )
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (prevData && prevData.hash === metadata.hash) {
      log('Hash is consistent. Skipping. Use --force to override.')
      return {
        metadata: prevData,
        run: () => (processing.resolve(), processing.promise)
      }
    }
  }

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
    JSON.stringify({ type: 'module' })
  )

  let deps: Record<string, string>
  if (!newDeps) {
    // Initial optimizeDeps at server start. Perform a fast scan using esbuild to
    // find deps to pre-bundle and include user hard-coded dependencies

    let missing: Record<string, string>
    ;({ deps, missing } = await scanImports(config))

    const missingIds = Object.keys(missing)
    if (missingIds.length) {
      processing.resolve()
      throw new Error(
        `The following dependencies are imported but could not be resolved:\n\n  ${missingIds
          .map(
            (id) =>
              `${colors.cyan(id)} ${colors.white(
                colors.dim(`(imported by ${missing[id]})`)
              )}`
          )
          .join(`\n  `)}\n\nAre they installed?`
      )
    }

    const include = config.optimizeDeps?.include
    if (include) {
      const resolve = config.createResolver({ asSrc: false })
      for (const id of include) {
        // normalize 'foo   >bar` as 'foo > bar' to prevent same id being added
        // and for pretty printing
        const normalizedId = normalizeId(id)
        if (!deps[normalizedId]) {
          const entry = await resolve(id)
          if (entry) {
            deps[normalizedId] = entry
          } else {
            processing.resolve()
            throw new Error(
              `Failed to resolve force included dependency: ${colors.cyan(id)}`
            )
          }
        }
      }
    }

    // update browser hash
    metadata.browserHash = getOptimizedBrowserHash(metadata.hash, deps)

    // We generate the mapping of dependency ids to their cache file location
    // before processing the dependencies with esbuild. This allow us to continue
    // processing files in the importAnalysis and resolve plugins
    for (const id in deps) {
      const entry = deps[id]
      metadata.optimized[id] = {
        file: getOptimizedDepPath(id, config),
        src: entry,
        browserHash: metadata.browserHash,
        processing: processing.promise
      }
    }
  } else {
    // Missing dependencies were found at run-time, optimizeDeps called while the
    // server is running
    deps = depsFromOptimizedDepInfo(newDeps)

    // Clone optimized info objects, fileHash, browserHash may be changed for them
    for (const o of Object.keys(newDeps)) {
      metadata.optimized[o] = { ...newDeps[o] }
    }

    // update global browser hash, but keep newDeps individual hashs until we know
    // if files are stable so we can avoid a full page reload
    metadata.browserHash = getOptimizedBrowserHash(metadata.hash, deps)
  }

  return { metadata, run: prebundleDeps }

  async function prebundleDeps(): Promise<DepOptimizationResult | undefined> {
    // We prebundle dependencies with esbuild and cache them, but there is no need
    // to wait here. Code that needs to access the cached deps needs to await
    // the optimizeDepsMetadata.processing promise

    const qualifiedIds = Object.keys(deps)

    if (!qualifiedIds.length) {
      // Write metadata file, delete `deps` folder and rename the `processing` folder to `deps`
      commitProcessingDepsCacheSync()
      log(`No dependencies to bundle. Skipping.\n\n\n`)
      processing.resolve()
      return
    }

    const total = qualifiedIds.length
    const maxListed = 5
    const listed = Math.min(total, maxListed)
    const extra = Math.max(0, total - maxListed)
    const depsString = colors.yellow(
      qualifiedIds.slice(0, listed).join(`\n  `) +
        (extra > 0 ? `\n  (...and ${extra} more)` : ``)
    )
    if (!asCommand) {
      if (!newDeps) {
        // This is auto run on server start - let the user know that we are
        // pre-optimizing deps
        logger.info(colors.green(`Pre-bundling dependencies:\n  ${depsString}`))
        logger.info(
          `(this will be run only when your dependencies or config have changed)`
        )
      }
    } else {
      logger.info(colors.green(`Optimizing dependencies:\n  ${depsString}`))
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

    const { plugins = [], ...esbuildOptions } =
      config.optimizeDeps?.esbuildOptions ?? {}

    await init
    for (const id in deps) {
      const flatId = flattenId(id)
      const filePath = (flatIdDeps[flatId] = deps[id])
      let exportsData: ExportsData
      if (
        config.optimizeDeps.extensions?.some((ext) => filePath.endsWith(ext))
      ) {
        // For custom supported extensions, build the entry file to transform it into JS,
        // and then parse with es-module-lexer. Note that the `bundle` option is not `true`,
        // so only the entry file is being transformed.
        const result = await build({
          ...esbuildOptions,
          plugins,
          entryPoints: [filePath],
          write: false,
          format: 'esm'
        })
        exportsData = parse(result.outputFiles[0].text) as ExportsData
      } else {
        const entryContent = fs.readFileSync(filePath, 'utf-8')
        try {
          exportsData = parse(entryContent) as ExportsData
        } catch {
          debug(
            `Unable to parse dependency: ${id}. Trying again with a JSX transform.`
          )
          const transformed = await transformWithEsbuild(
            entryContent,
            filePath,
            {
              loader: 'jsx'
            }
          )
          // Ensure that optimization won't fail by defaulting '.js' to the JSX parser.
          // This is useful for packages such as Gatsby.
          esbuildOptions.loader = {
            '.js': 'jsx',
            ...esbuildOptions.loader
          }
          exportsData = parse(transformed.code) as ExportsData
        }
        for (const { ss, se } of exportsData[0]) {
          const exp = entryContent.slice(ss, se)
          if (/export\s+\*\s+from/.test(exp)) {
            exportsData.hasReExports = true
          }
        }
      }

      idToExports[id] = exportsData
      flatIdToExports[flatId] = exportsData
    }

    const define: Record<string, string> = {
      'process.env.NODE_ENV': JSON.stringify(config.mode)
    }
    for (const key in config.define) {
      const value = config.define[key]
      define[key] = typeof value === 'string' ? value : JSON.stringify(value)
    }

    const start = performance.now()

    const result = await build({
      absWorkingDir: process.cwd(),
      entryPoints: Object.keys(flatIdDeps),
      bundle: true,
      format: 'esm',
      target: config.build.target || undefined,
      external: config.optimizeDeps?.exclude,
      logLevel: 'error',
      splitting: true,
      sourcemap: true,
      outdir: processingCacheDir,
      ignoreAnnotations: true,
      metafile: true,
      define,
      plugins: [
        ...plugins,
        esbuildDepPlugin(flatIdDeps, flatIdToExports, config, ssr)
      ],
      ...esbuildOptions
    })

    const meta = result.metafile!

    // the paths in `meta.outputs` are relative to `process.cwd()`
    const processingCacheDirOutputPath = path.relative(
      process.cwd(),
      processingCacheDir
    )

    for (const id in deps) {
      const optimizedInfo = metadata.optimized[id]
      optimizedInfo.needsInterop = needsInterop(
        id,
        idToExports[id],
        meta.outputs,
        processingCacheDirOutputPath
      )
      const output =
        meta.outputs[path.relative(process.cwd(), optimizedInfo.file)]
      if (output) {
        // We only need to hash the output.imports in to check for stability, but adding the hash
        // and file path gives us a unique hash that may be useful for other things in the future
        optimizedInfo.fileHash = getHash(
          metadata.hash + optimizedInfo.file + JSON.stringify(output.imports)
        )
      }
    }

    // This only runs when missing deps are processed. Previous optimized deps are stable if
    // the newly discovered deps don't have common chunks with them. Comparing their fileHash we
    // can find out if it is safe to keep the current browser state. If one of the file hashes
    // changed, a full page reload is needed
    let alteredFiles = false
    if (currentData) {
      alteredFiles = Object.keys(currentData.optimized).some((dep) => {
        const currentInfo = currentData.optimized[dep]
        const info = metadata.optimized[dep]
        return (
          !info?.fileHash ||
          !currentInfo?.fileHash ||
          info?.fileHash !== currentInfo?.fileHash
        )
      })
      debug(`optimized deps have altered files: ${alteredFiles}`)
    }

    if (alteredFiles) {
      // Overrite individual hashes with the new global browserHash, a full page reload is required
      // New deps that ended up with a different hash replaced while doing analysis import are going to
      // return a not found so the browser doesn't cache them. And will properly get loaded after the reload
      for (const id in deps) {
        metadata.optimized[id].browserHash = metadata.browserHash
      }
    }

    // Write metadata file, delete `deps` folder and rename the new `processing` folder to `deps` in sync
    commitProcessingDepsCacheSync()

    debug(`deps bundled in ${(performance.now() - start).toFixed(2)}ms`)
    processing.resolve({ alteredFiles })
    return processing.promise
  }

  function commitProcessingDepsCacheSync() {
    // Rewire the file paths from the temporal processing dir to the final deps cache dir
    const dataPath = path.join(processingCacheDir, '_metadata.json')
    writeFile(dataPath, stringifyOptimizedDepsMetadata(metadata))
    // Processing is done, we can now replace the depsCacheDir with processingCacheDir
    if (fs.existsSync(depsCacheDir)) {
      const rmSync = fs.rmSync ?? fs.rmdirSync // TODO: Remove after support for Node 12 is dropped
      rmSync(depsCacheDir, { recursive: true })
    }
    fs.renameSync(processingCacheDir, depsCacheDir)
  }
}

export function newDepOptimizationProcessing(): DepOptimizationProcessing {
  let resolve: (result?: DepOptimizationResult) => void
  const promise = new Promise((_resolve) => {
    resolve = _resolve
  }) as Promise<DepOptimizationResult | undefined>
  return { promise, resolve: resolve! }
}

// Convert to { id: src }
export function depsFromOptimizedDepInfo(
  depsInfo: Record<string, OptimizedDepInfo>
) {
  return Object.fromEntries(
    Object.entries(depsInfo).map((d) => [d[0], d[1].src])
  )
}

function getHash(text: string) {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function getOptimizedBrowserHash(
  hash: string,
  deps: Record<string, string>,
  missing?: Record<string, string>
) {
  // update browser hash
  return getHash(
    hash + JSON.stringify(deps) + (missing ? JSON.stringify(missing) : '')
  )
}

function getCachedDepFilePath(id: string, depsCacheDir: string) {
  return normalizePath(path.resolve(depsCacheDir, flattenId(id) + '.js'))
}

export function getOptimizedDepPath(id: string, config: ResolvedConfig) {
  return getCachedDepFilePath(id, getDepsCacheDir(config))
}

export function getDepsCacheDir(config: ResolvedConfig) {
  return normalizePath(path.resolve(config.cacheDir, 'deps'))
}

export function getProcessingDepsCacheDir(config: ResolvedConfig) {
  return normalizePath(path.resolve(config.cacheDir, 'processing'))
}

export function isOptimizedDepFile(id: string, config: ResolvedConfig) {
  return id.startsWith(getDepsCacheDir(config))
}

export function createIsOptimizedDepUrl(config: ResolvedConfig) {
  const { root } = config
  const depsCacheDir = getDepsCacheDir(config)

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

function parseOptimizedDepsMetadata(
  jsonMetadata: string,
  depsCacheDir: string,
  processing: Promise<DepOptimizationResult | undefined>
) {
  const metadata = JSON.parse(jsonMetadata)
  for (const o of Object.keys(metadata.optimized)) {
    metadata.optimized[o].processing = processing
  }
  return { ...metadata, discovered: {}, processing }
}

function stringifyOptimizedDepsMetadata(metadata: DepOptimizationMetadata) {
  return JSON.stringify(
    metadata,
    (key: string, value: any) => {
      if (key === 'processing' || key === 'discovered') return

      return value
    },
    2
  )
}

// https://github.com/vitejs/vite/issues/1724#issuecomment-767619642
// a list of modules that pretends to be ESM but still uses `require`.
// this causes esbuild to wrap them as CJS even when its entry appears to be ESM.
const KNOWN_INTEROP_IDS = new Set(['moment'])

function needsInterop(
  id: string,
  exportsData: ExportsData,
  outputs: Record<string, any>,
  cacheDirOutputPath: string
): boolean {
  if (KNOWN_INTEROP_IDS.has(id)) {
    return true
  }
  const [imports, exports] = exportsData
  // entry has no ESM syntax - likely CJS or UMD
  if (!exports.length && !imports.length) {
    return true
  }

  // if a peer dependency used require() on a ESM dependency, esbuild turns the
  // ESM dependency's entry chunk into a single default export... detect
  // such cases by checking exports mismatch, and force interop.
  const flatId = flattenId(id) + '.js'
  let generatedExports: string[] | undefined
  for (const output in outputs) {
    if (
      normalizePath(output) ===
      normalizePath(path.join(cacheDirOutputPath, flatId))
    ) {
      generatedExports = outputs[output].exports
      break
    }
  }

  if (
    !generatedExports ||
    (isSingleDefaultExport(generatedExports) && !isSingleDefaultExport(exports))
  ) {
    return true
  }
  return false
}

function isSingleDefaultExport(exports: readonly string[]) {
  return exports.length === 1 && exports[0] === 'default'
}

const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

function getDepHash(root: string, config: ResolvedConfig): string {
  let content = lookupFile(root, lockfileFormats) || ''
  // also take config into account
  // only a subset of config options that can affect dep optimization
  content += JSON.stringify(
    {
      mode: config.mode,
      root: config.root,
      resolve: config.resolve,
      assetsInclude: config.assetsInclude,
      plugins: config.plugins.map((p) => p.name),
      optimizeDeps: {
        include: config.optimizeDeps?.include,
        exclude: config.optimizeDeps?.exclude,
        esbuildOptions: {
          ...config.optimizeDeps?.esbuildOptions,
          plugins: config.optimizeDeps?.esbuildOptions?.plugins?.map(
            (p) => p.name
          )
        }
      }
    },
    (_, value) => {
      if (typeof value === 'function' || value instanceof RegExp) {
        return value.toString()
      }
      return value
    }
  )
  return createHash('sha256').update(content).digest('hex').substring(0, 8)
}
