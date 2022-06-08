import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import _debug from 'debug'
import colors from 'picocolors'
import type { BuildOptions as EsbuildBuildOptions } from 'esbuild'
import { build } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import type { ResolvedConfig } from '../config'
import {
  createDebugger,
  emptyDir,
  flattenId,
  getHash,
  lookupFile,
  normalizeId,
  normalizePath,
  removeDir,
  renameDir,
  writeFile
} from '../utils'
import { transformWithEsbuild } from '../plugins/esbuild'
import { esbuildDepPlugin } from './esbuildDepPlugin'
import { scanImports } from './scan'
export { initDepsOptimizer, getDepsOptimizer } from './optimizer'

export const debuggerViteDeps = createDebugger('vite:deps')
const debug = debuggerViteDeps
const isDebugEnabled = _debug('vite:deps').enabled

const jsExtensionRE = /\.js$/i
const jsMapExtensionRE = /\.js\.map$/i

export type ExportsData = {
  hasImports: boolean
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
  options: DepOptimizationOptions
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
   * Enable esbuild based scan phase, to get back to the optimized deps discovery
   * strategy used in Vite v2
   * @default false
   * @experimental
   */
  devScan?: boolean
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
   * By default, Vite can optimize `.mjs`, `.js`, and `.ts` files. This option
   * allows specifying additional extensions.
   *
   * @experimental
   */
  extensions?: string[]
  /**
   * Disables dependencies optimizations, true disables the optimizer during
   * build and dev. Pass 'build' or 'dev' to only disable the optimizer in
   * one of the modes. Deps optimization is enabled by default in both
   * @default false
   * @experimental
   */
  disabled?: boolean | 'build' | 'dev'
}

export interface DepOptimizationResult {
  metadata: DepOptimizationMetadata
  /**
   * When doing a re-run, if there are newly discovered dependendencies
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
 * Used by Vite CLI when running `vite optimize`
 */
export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.force,
  asCommand = false
): Promise<DepOptimizationMetadata> {
  const log = asCommand ? config.logger.info : debug

  const cachedMetadata = loadCachedDepOptimizationMetadata(
    config,
    force,
    asCommand
  )
  if (cachedMetadata) {
    return cachedMetadata
  }
  const depsInfo = await discoverProjectDependencies(config)

  const depsString = depsLogString(Object.keys(depsInfo))
  log(colors.green(`Optimizing dependencies:\n  ${depsString}`))

  const result = await runOptimizeDeps(config, depsInfo)

  await result.commit()

  return result.metadata
}

export function initDepsOptimizerMetadata(
  config: ResolvedConfig,
  timestamp?: string
): DepOptimizationMetadata {
  const hash = getDepHash(config)
  return {
    hash,
    browserHash: getOptimizedBrowserHash(hash, {}, timestamp),
    optimized: {},
    chunks: {},
    discovered: {},
    depInfoList: []
  }
}

export function addOptimizedDepInfo(
  metadata: DepOptimizationMetadata,
  type: 'optimized' | 'discovered' | 'chunks',
  depInfo: OptimizedDepInfo
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
  force = config.force,
  asCommand = false
): DepOptimizationMetadata | undefined {
  const log = asCommand ? config.logger.info : debug

  // Before Vite 2.9, dependencies were cached in the root of the cacheDir
  // For compat, we remove the cache if we find the old structure
  if (fs.existsSync(path.join(config.cacheDir, '_metadata.json'))) {
    emptyDir(config.cacheDir)
  }

  const depsCacheDir = getDepsCacheDir(config)

  if (!force) {
    let cachedMetadata: DepOptimizationMetadata | undefined
    try {
      const cachedMetadataPath = path.join(depsCacheDir, '_metadata.json')
      cachedMetadata = parseDepsOptimizerMetadata(
        fs.readFileSync(cachedMetadataPath, 'utf-8'),
        depsCacheDir
      )
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (cachedMetadata && cachedMetadata.hash === getDepHash(config)) {
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
export async function discoverProjectDependencies(
  config: ResolvedConfig,
  timestamp?: string
): Promise<Record<string, OptimizedDepInfo>> {
  const { deps, missing } = await scanImports(config)

  const missingIds = Object.keys(missing)
  if (missingIds.length) {
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

  return initialProjectDependencies(config, timestamp, deps)
}

/**
 * Create the initial discovered deps list. At build time we only
 * have the manually included deps. During dev, a scan phase is
 * performed and knownDeps is the list of discovered deps
 */
export async function initialProjectDependencies(
  config: ResolvedConfig,
  timestamp?: string,
  knownDeps?: Record<string, string>
): Promise<Record<string, OptimizedDepInfo>> {
  const deps: Record<string, string> = knownDeps ?? {}

  await addManuallyIncludedOptimizeDeps(deps, config)

  const browserHash = getOptimizedBrowserHash(
    getDepHash(config),
    deps,
    timestamp
  )
  const discovered: Record<string, OptimizedDepInfo> = {}
  for (const id in deps) {
    const src = deps[id]
    discovered[id] = {
      id,
      file: getOptimizedDepPath(id, config),
      src,
      browserHash: browserHash,
      exportsData: extractExportsData(src, config)
    }
  }
  return discovered
}

export function depsLogString(qualifiedIds: string[]): string {
  if (isDebugEnabled) {
    return colors.yellow(qualifiedIds.join(`\n  `))
  } else {
    const total = qualifiedIds.length
    const maxListed = 5
    const listed = Math.min(total, maxListed)
    const extra = Math.max(0, total - maxListed)
    return colors.yellow(
      qualifiedIds.slice(0, listed).join(`, `) +
        (extra > 0 ? `, ...and ${extra} more` : ``)
    )
  }
}

/**
 * Internally, Vite uses this function to prepare a optimizeDeps run. When Vite starts, we can get
 * the metadata and start the server without waiting for the optimizeDeps processing to be completed
 */
export async function runOptimizeDeps(
  resolvedConfig: ResolvedConfig,
  depsInfo: Record<string, OptimizedDepInfo>
): Promise<DepOptimizationResult> {
  const config: ResolvedConfig = {
    ...resolvedConfig,
    command: 'build'
  }

  const depsCacheDir = getDepsCacheDir(resolvedConfig)
  const processingCacheDir = getProcessingDepsCacheDir(resolvedConfig)

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

  const metadata = initDepsOptimizerMetadata(config)

  metadata.browserHash = getOptimizedBrowserHash(
    metadata.hash,
    depsFromOptimizedDepInfo(depsInfo)
  )

  // We prebundle dependencies with esbuild and cache them, but there is no need
  // to wait here. Code that needs to access the cached deps needs to await
  // the optimizedDepInfo.processing promise for each dep

  const qualifiedIds = Object.keys(depsInfo)

  const processingResult: DepOptimizationResult = {
    metadata,
    async commit() {
      // Write metadata file, delete `deps` folder and rename the `processing` folder to `deps`
      // Processing is done, we can now replace the depsCacheDir with processingCacheDir
      // Rewire the file paths from the temporal processing dir to the final deps cache dir
      await removeDir(depsCacheDir)
      await renameDir(processingCacheDir, depsCacheDir)
    },
    cancel() {
      fs.rmSync(processingCacheDir, { recursive: true, force: true })
    }
  }

  if (!qualifiedIds.length) {
    return processingResult
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

  for (const id in depsInfo) {
    const src = depsInfo[id].src!
    const exportsData = await (depsInfo[id].exportsData ??
      extractExportsData(src, config))
    if (exportsData.jsxLoader) {
      // Ensure that optimization won't fail by defaulting '.js' to the JSX parser.
      // This is useful for packages such as Gatsby.
      esbuildOptions.loader = {
        '.js': 'jsx',
        ...esbuildOptions.loader
      }
    }
    const flatId = flattenId(id)
    flatIdDeps[flatId] = src
    idToExports[id] = exportsData
    flatIdToExports[flatId] = exportsData
  }

  const define: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || config.mode)
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
    ignoreAnnotations: resolvedConfig.command !== 'build',
    metafile: true,
    define,
    plugins: [
      ...plugins,
      esbuildDepPlugin(flatIdDeps, flatIdToExports, config)
    ],
    ...esbuildOptions
  })

  const meta = result.metafile!

  // the paths in `meta.outputs` are relative to `process.cwd()`
  const processingCacheDirOutputPath = path.relative(
    process.cwd(),
    processingCacheDir
  )

  for (const id in depsInfo) {
    const output = esbuildOutputFromId(meta.outputs, id, processingCacheDir)

    const { exportsData, ...info } = depsInfo[id]
    addOptimizedDepInfo(metadata, 'optimized', {
      ...info,
      // We only need to hash the output.imports in to check for stability, but adding the hash
      // and file path gives us a unique hash that may be useful for other things in the future
      fileHash: getHash(
        metadata.hash + depsInfo[id].file + JSON.stringify(output.imports)
      ),
      browserHash: metadata.browserHash,
      // After bundling we have more information and can warn the user about legacy packages
      // that require manual configuration
      needsInterop: needsInterop(config, id, idToExports[id], output)
    })
  }

  for (const o of Object.keys(meta.outputs)) {
    if (!o.match(jsMapExtensionRE)) {
      const id = path
        .relative(processingCacheDirOutputPath, o)
        .replace(jsExtensionRE, '')
      const file = getOptimizedDepPath(id, resolvedConfig)
      if (
        !findOptimizedDepInfoInRecord(
          metadata.optimized,
          (depInfo) => depInfo.file === file
        )
      ) {
        addOptimizedDepInfo(metadata, 'chunks', {
          id,
          file,
          needsInterop: false,
          browserHash: metadata.browserHash
        })
      }
    }
  }

  const dataPath = path.join(processingCacheDir, '_metadata.json')
  writeFile(dataPath, stringifyDepsOptimizerMetadata(metadata, depsCacheDir))

  debug(`deps bundled in ${(performance.now() - start).toFixed(2)}ms`)

  return processingResult
}

export async function findKnownImports(
  config: ResolvedConfig
): Promise<string[]> {
  const deps = (await scanImports(config)).deps
  await addManuallyIncludedOptimizeDeps(deps, config)
  return Object.keys(deps)
}

async function addManuallyIncludedOptimizeDeps(
  deps: Record<string, string>,
  config: ResolvedConfig
): Promise<void> {
  const include = config.optimizeDeps?.include
  if (include) {
    const resolve = config.createResolver({ asSrc: false, scan: true })
    for (const id of include) {
      // normalize 'foo   >bar` as 'foo > bar' to prevent same id being added
      // and for pretty printing
      const normalizedId = normalizeId(id)
      if (!deps[normalizedId]) {
        const entry = await resolve(id)
        if (entry) {
          deps[normalizedId] = entry
        } else {
          throw new Error(
            `Failed to resolve force included dependency: ${colors.cyan(id)}`
          )
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
  depsInfo: Record<string, OptimizedDepInfo>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(depsInfo).map((d) => [d[0], d[1].src!])
  )
}

export function getOptimizedDepPath(
  id: string,
  config: ResolvedConfig
): string {
  return normalizePath(
    path.resolve(getDepsCacheDir(config), flattenId(id) + '.js')
  )
}

function getDepsCacheSuffix(config: ResolvedConfig): string {
  let suffix = ''
  if (config.command === 'build') {
    suffix += '_build'
    if (config.build.ssr) {
      suffix += '_ssr'
    }
  }
  return suffix
}
export function getDepsCacheDir(config: ResolvedConfig): string {
  const dirName = 'deps' + getDepsCacheSuffix(config)
  return normalizePath(path.resolve(config.cacheDir, dirName))
}

function getProcessingDepsCacheDir(config: ResolvedConfig) {
  const dirName = 'deps' + getDepsCacheSuffix(config) + '_temp'
  return normalizePath(path.resolve(config.cacheDir, dirName))
}

export function isOptimizedDepFile(
  id: string,
  config: ResolvedConfig
): boolean {
  return id.startsWith(getDepsCacheDir(config))
}

export function createIsOptimizedDepUrl(
  config: ResolvedConfig
): (url: string) => boolean {
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

function parseDepsOptimizerMetadata(
  jsonMetadata: string,
  depsCacheDir: string
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
    }
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
    depInfoList: []
  }
  for (const id of Object.keys(optimized)) {
    addOptimizedDepInfo(metadata, 'optimized', {
      ...optimized[id],
      id,
      browserHash
    })
  }
  for (const id of Object.keys(chunks)) {
    addOptimizedDepInfo(metadata, 'chunks', {
      ...chunks[id],
      id,
      browserHash,
      needsInterop: false
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
  depsCacheDir: string
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
              needsInterop
            }
          ]
        )
      ),
      chunks: Object.fromEntries(
        Object.values(chunks).map(({ id, file }) => [id, { file }])
      )
    },
    (key: string, value: string) => {
      // Paths can be absolute or relative to the deps cache dir where
      // the _metadata.json is located
      if (key === 'file' || key === 'src') {
        return normalizePath(path.relative(depsCacheDir, value))
      }
      return value
    },
    2
  )
}

function esbuildOutputFromId(
  outputs: Record<string, any>,
  id: string,
  cacheDirOutputPath: string
): any {
  const flatId = flattenId(id) + '.js'
  return outputs[
    normalizePath(
      path.relative(process.cwd(), path.join(cacheDirOutputPath, flatId))
    )
  ]
}

export async function extractExportsData(
  filePath: string,
  config: ResolvedConfig
): Promise<ExportsData> {
  await init

  const esbuildOptions = config.optimizeDeps?.esbuildOptions ?? {}
  if (config.optimizeDeps.extensions?.some((ext) => filePath.endsWith(ext))) {
    // For custom supported extensions, build the entry file to transform it into JS,
    // and then parse with es-module-lexer. Note that the `bundle` option is not `true`,
    // so only the entry file is being transformed.
    const result = await build({
      ...esbuildOptions,
      entryPoints: [filePath],
      write: false,
      format: 'esm'
    })
    const [imports, exports, facade] = parse(result.outputFiles[0].text)
    return {
      hasImports: imports.length > 0,
      exports,
      facade
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
      `Unable to parse: ${filePath}.\n Trying again with a ${loader} transform.`
    )
    const transformed = await transformWithEsbuild(entryContent, filePath, {
      loader
    })
    // Ensure that optimization won't fail by defaulting '.js' to the JSX parser.
    // This is useful for packages such as Gatsby.
    esbuildOptions.loader = {
      '.js': 'jsx',
      ...esbuildOptions.loader
    }
    parseResult = parse(transformed.code)
    usedJsxLoader = true
  }

  const [imports, exports, facade] = parseResult
  const exportsData: ExportsData = {
    hasImports: imports.length > 0,
    exports,
    facade,
    hasReExports: imports.some(({ ss, se }) => {
      const exp = entryContent.slice(ss, se)
      return /export\s+\*\s+from/.test(exp)
    }),
    jsxLoader: usedJsxLoader
  }
  return exportsData
}

// https://github.com/vitejs/vite/issues/1724#issuecomment-767619642
// a list of modules that pretends to be ESM but still uses `require`.
// this causes esbuild to wrap them as CJS even when its entry appears to be ESM.
const KNOWN_INTEROP_IDS = new Set(['moment'])

function needsInterop(
  config: ResolvedConfig,
  id: string,
  exportsData: ExportsData,
  output?: { exports: string[] }
): boolean {
  if (
    config.optimizeDeps?.needsInterop?.includes(id) ||
    KNOWN_INTEROP_IDS.has(id)
  ) {
    return true
  }
  const { hasImports, exports } = exportsData
  // entry has no ESM syntax - likely CJS or UMD
  if (!exports.length && !hasImports) {
    return true
  }

  if (output) {
    // if a peer dependency used require() on a ESM dependency, esbuild turns the
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

const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

export function getDepHash(config: ResolvedConfig): string {
  let content = lookupFile(config.root, lockfileFormats) || ''
  // also take config into account
  // only a subset of config options that can affect dep optimization
  content += JSON.stringify(
    {
      mode: process.env.NODE_ENV || config.mode,
      root: config.root,
      define: config.define,
      resolve: config.resolve,
      buildTarget: config.build.target,
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
  return getHash(content)
}

function getOptimizedBrowserHash(
  hash: string,
  deps: Record<string, string>,
  timestamp = ''
) {
  return getHash(hash + JSON.stringify(deps) + timestamp)
}

export function optimizedDepInfoFromId(
  metadata: DepOptimizationMetadata,
  id: string
): OptimizedDepInfo | undefined {
  return (
    metadata.optimized[id] || metadata.discovered[id] || metadata.chunks[id]
  )
}

export function optimizedDepInfoFromFile(
  metadata: DepOptimizationMetadata,
  file: string
): OptimizedDepInfo | undefined {
  return metadata.depInfoList.find((depInfo) => depInfo.file === file)
}

function findOptimizedDepInfoInRecord(
  dependenciesInfo: Record<string, OptimizedDepInfo>,
  callbackFn: (depInfo: OptimizedDepInfo, id: string) => any
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
  config: ResolvedConfig
): Promise<boolean | undefined> {
  const depInfo = optimizedDepInfoFromFile(metadata, file)
  if (depInfo?.src && depInfo.needsInterop === undefined) {
    depInfo.exportsData ??= extractExportsData(depInfo.src, config)
    depInfo.needsInterop = needsInterop(
      config,
      depInfo.id,
      await depInfo.exportsData
    )
  }
  return depInfo?.needsInterop
}
