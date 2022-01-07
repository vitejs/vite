import fs from 'fs'
import path, { extname } from 'path'
import type { LoadResult, ModuleInfo, PartialResolvedId } from 'rollup'
import { parse as parseUrl } from 'url'
import getEtag from 'etag'
import type { FSWatcher } from 'chokidar'
import { performance } from 'perf_hooks'
import { isDirectCSSRequest } from '../plugins/css'
import {
  asyncPool,
  cleanUrl,
  createDebugger,
  ensureWatchedFile,
  getLockAndConfigHash,
  normalizePath,
  removeImportQuery,
  removeTimestampQuery,
  timeFrom
} from '../utils'
import { CLIENT_PUBLIC_PATH, FS_PREFIX } from '../constants'
import type { ResolvedConfig } from '../config'
import type { TransformResult } from './transformRequest'

export class ModuleNode {
  /**
   * Public served url path, starts with /
   */
  url: string
  /**
   * Resolved file system path + query
   */
  id: string | null = null
  file: string | null = null
  type: 'js' | 'css'
  info?: ModuleInfo
  meta?: Record<string, any>
  importers = new Set<ModuleNode>()
  importedModules = new Set<ModuleNode>()
  acceptedHmrDeps = new Set<ModuleNode>()
  isSelfAccepting = false
  transformResult: TransformResult | null = null
  ssrTransformResult: TransformResult | null = null
  ssrModule: Record<string, any> | null = null
  lastHMRTimestamp = 0
  sourceEtag: string | null = null

  constructor(url: string) {
    this.url = url
    this.type = isDirectCSSRequest(url) ? 'css' : 'js'
  }
}

type Cache = {
  configHash: string
  files: {
    [path: string]: {
      sourceEtag: string
      transformResult: TransformResult
    }
  }
}

const isDebug = !!process.env.DEBUG
const debugModuleGraph = createDebugger('vite:moduleGraph')

function invalidateSSRModule(mod: ModuleNode, seen: Set<ModuleNode>) {
  if (seen.has(mod)) {
    return
  }
  seen.add(mod)
  mod.ssrModule = null
  mod.importers.forEach((importer) => invalidateSSRModule(importer, seen))
}

export type ResolvedUrl = [
  url: string,
  resolvedId: string,
  meta: object | null | undefined
]

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  fileToModulesMap = new Map<string, Set<ModuleNode>>()
  safeModulesPath = new Set<string>()

  constructor(
    private resolveId: (
      url: string,
      ssr: boolean
    ) => Promise<PartialResolvedId | null>,
    private load: (id: string) => Promise<LoadResult | null>,
    private config: ResolvedConfig,
    private watcher: FSWatcher,
    private saveCacheState: {
      promise?: Promise<void>
      timeout?: NodeJS.Timeout
      canQueue: boolean
    } = { canQueue: !!config.cacheDir }
  ) {}

  async getModuleByUrl(
    rawUrl: string,
    ssr?: boolean
  ): Promise<ModuleNode | undefined> {
    const [url] = await this.resolveUrl(rawUrl, ssr)
    return this.urlToModuleMap.get(url)
  }

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(removeTimestampQuery(id))
  }

  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    return this.fileToModulesMap.get(file)
  }

  onFileChange(file: string): void {
    const mods = this.getModulesByFile(file)
    if (mods) {
      const seen = new Set<ModuleNode>()
      mods.forEach((mod) => {
        this.invalidateModule(mod, seen)
      })
    }
  }

  invalidateModule(mod: ModuleNode, seen: Set<ModuleNode> = new Set()): void {
    mod.info = undefined
    mod.transformResult = null
    mod.ssrTransformResult = null
    invalidateSSRModule(mod, seen)
  }

  invalidateAll(): void {
    const seen = new Set<ModuleNode>()
    this.idToModuleMap.forEach((mod) => {
      this.invalidateModule(mod, seen)
    })
  }

  /**
   * Update the module graph based on a module's updated imports information
   * If there are dependencies that no longer have any importers, they are
   * returned as a Set.
   */
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    acceptedModules: Set<string | ModuleNode>,
    isSelfAccepting: boolean,
    ssr?: boolean
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = mod.importedModules
    const nextImports = (mod.importedModules = new Set())
    let noLongerImported: Set<ModuleNode> | undefined
    // update import graph
    for (const imported of importedModules) {
      const dep =
        typeof imported === 'string'
          ? await this.ensureEntryFromUrl(imported, ssr)
          : imported
      dep.importers.add(mod)
      nextImports.add(dep)
    }
    // remove the importer from deps that were imported but no longer are.
    prevImports.forEach((dep) => {
      if (!nextImports.has(dep)) {
        dep.importers.delete(mod)
        if (!dep.importers.size) {
          // dependency no longer imported
          ;(noLongerImported || (noLongerImported = new Set())).add(dep)
        }
      }
    })
    // update accepted hmr deps
    const deps = (mod.acceptedHmrDeps = new Set())
    for (const accepted of acceptedModules) {
      const dep =
        typeof accepted === 'string'
          ? await this.ensureEntryFromUrl(accepted, ssr)
          : accepted
      deps.add(dep)
    }
    return noLongerImported
  }

  async ensureEntryFromUrl(rawUrl: string, ssr?: boolean): Promise<ModuleNode> {
    const [url, resolvedId, meta] = await this.resolveUrl(rawUrl, ssr)
    let mod = this.urlToModuleMap.get(url)
    if (!mod) {
      mod = new ModuleNode(url)
      if (meta) mod.meta = meta
      this.urlToModuleMap.set(url, mod)
      mod.id = resolvedId
      this.idToModuleMap.set(resolvedId, mod)
      const file = (mod.file = cleanUrl(resolvedId))
      let fileMappedModules = this.fileToModulesMap.get(file)
      if (!fileMappedModules) {
        fileMappedModules = new Set()
        this.fileToModulesMap.set(file, fileMappedModules)
      }
      fileMappedModules.add(mod)
    }
    return mod
  }

  // some deps, like a css file referenced via @import, don't have its own
  // url because they are inlined into the main css import. But they still
  // need to be represented in the module graph so that they can trigger
  // hmr in the importing css file.
  createFileOnlyEntry(file: string): ModuleNode {
    file = normalizePath(file)
    let fileMappedModules = this.fileToModulesMap.get(file)
    if (!fileMappedModules) {
      fileMappedModules = new Set()
      this.fileToModulesMap.set(file, fileMappedModules)
    }

    const url = `${FS_PREFIX}${file}`
    for (const m of fileMappedModules) {
      if (m.url === url || m.id === file) {
        return m
      }
    }

    const mod = new ModuleNode(url)
    mod.file = file
    fileMappedModules.add(mod)
    return mod
  }

  // for incoming urls, it is important to:
  // 1. remove the HMR timestamp query (?t=xxxx)
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    url = removeImportQuery(removeTimestampQuery(url))
    const resolved = await this.resolveId(url, !!ssr)
    const resolvedId = resolved?.id || url
    const ext = extname(cleanUrl(resolvedId))
    const { pathname, search, hash } = parseUrl(url)
    if (ext && !pathname!.endsWith(ext)) {
      url = pathname + ext + (search || '') + (hash || '')
    }
    return [url, resolvedId, resolved?.meta]
  }

  async loadCache(): Promise<void> {
    const start = isDebug ? performance.now() : 0
    if (this.config.server.force) {
      isDebug && debugModuleGraph('Running with force, loadCache skipped')
      return
    }
    const cacheLocation = this.getCacheLocation()
    if (!cacheLocation) {
      isDebug && debugModuleGraph('Cache disabled, loadCache skipped')
      return
    }
    if (!fs.existsSync(cacheLocation)) {
      isDebug && debugModuleGraph('Cache not found')
      return
    }
    let cache: Cache
    try {
      cache = JSON.parse(fs.readFileSync(cacheLocation, { encoding: 'utf-8' }))
    } catch {
      // This can happen when the process is killed while writing to disk.
      isDebug && debugModuleGraph('Corrupted cache, cache not loaded')
      return
    }
    if (cache.configHash !== this.getCacheHash()) {
      isDebug && debugModuleGraph("Config hash didn't match, cache not loaded")
      return
    }
    await asyncPool({
      concurrency: 10,
      items: Object.entries(cache.files),
      fn: async ([url, value]) => {
        const id = (await this.resolveId(url, false))?.id || url
        let loadResult = await this.load(id)
        if (!loadResult) {
          try {
            loadResult = await fs.promises.readFile(id, 'utf-8')
          } catch (e) {
            if (e.code !== 'ENOENT') throw e
          }
        }
        if (!loadResult) {
          isDebug && debugModuleGraph(`Module ${url} not found`)
          return
        }
        const code =
          typeof loadResult === 'object' ? loadResult.code : loadResult
        if (getEtag(code, { weak: true }) !== value.sourceEtag) {
          isDebug && debugModuleGraph(`Module ${url} changed`)
          return
        }
        const module = await this.ensureEntryFromUrl(url)
        ensureWatchedFile(this.watcher, module.file, this.config.root)
        module.sourceEtag = value.sourceEtag
        module.transformResult = value.transformResult
      }
    })
    isDebug &&
      debugModuleGraph(
        timeFrom(start),
        `${this.urlToModuleMap.size}/${
          Object.keys(cache.files).length
        } modules restored`
      )
  }

  queueSaveCache(): void {
    if (!this.saveCacheState.canQueue) return
    if (this.saveCacheState.timeout) clearTimeout(this.saveCacheState.timeout)
    this.saveCacheState.timeout = setTimeout(() => {
      this.saveCacheState.timeout = undefined
      this.saveCache()
    }, 500)
  }

  async close(save: boolean = true): Promise<void> {
    if (this.saveCacheState.timeout) clearTimeout(this.saveCacheState.timeout)
    this.saveCacheState.canQueue = false
    if (save) return this.saveCache()
  }

  private async saveCache(): Promise<void> {
    if (!this.saveCacheState.promise) {
      this.saveCacheState.promise = this.unsafelySaveCache().finally(() => {
        this.saveCacheState.promise = undefined
      })
    }
    return this.saveCacheState.promise
  }

  private async unsafelySaveCache(): Promise<void> {
    const start = isDebug ? performance.now() : 0
    const cacheLocation = this.getCacheLocation()
    if (!cacheLocation) {
      isDebug && debugModuleGraph('No cache location, saveCache skipped')
      return
    }
    const cache: Cache = { configHash: this.getCacheHash(), files: {} }
    this.urlToModuleMap.forEach((module, url) => {
      if (!module.transformResult) return
      if (
        !module.sourceEtag ||
        url.includes('node_modules') ||
        /[?&]html-proxy\b/.test(url) || // Caching html proxy would require re-populate the htmlProxyMap
        url.startsWith(FS_PREFIX) ||
        url.startsWith(CLIENT_PUBLIC_PATH)
      ) {
        return
      }
      cache.files[url] = {
        sourceEtag: module.sourceEtag,
        transformResult: module.transformResult
      }
    })
    await fs.promises.writeFile(cacheLocation, JSON.stringify(cache))
    isDebug &&
      debugModuleGraph(
        timeFrom(start),
        `${Object.keys(cache.files).length}/${
          this.urlToModuleMap.size
        } modules saved`
      )
  }

  private getCacheHash(): string {
    return getLockAndConfigHash(this.config.root, {
      mode: this.config.mode,
      root: this.config.root,
      resolve: this.config.resolve,
      esbuild: this.config.esbuild,
      css: this.config.css,
      define: this.config.define,
      env: this.config.env,
      configFileHash: this.config.configFileHash
    })
  }

  private getCacheLocation(): string | undefined {
    if (!this.config.cacheDir) return
    return path.resolve(this.config.cacheDir, '_moduleCache.json')
  }
}
