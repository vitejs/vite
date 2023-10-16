import { extname } from 'node:path'
import type { ModuleInfo, PartialResolvedId } from 'rollup'
import { isDirectCSSRequest } from '../plugins/css'
import {
  cleanUrl,
  normalizePath,
  removeImportQuery,
  removeTimestampQuery,
} from '../utils'
import { FS_PREFIX } from '../constants'
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
  clientImportedModules = new Set<ModuleNode>()
  ssrImportedModules = new Set<ModuleNode>()
  acceptedHmrDeps = new Set<ModuleNode>()
  acceptedHmrExports: Set<string> | null = null
  importedBindings: Map<string, Set<string>> | null = null
  isSelfAccepting?: boolean
  transformResult: TransformResult | null = null
  ssrTransformResult: TransformResult | null = null
  ssrModule: Record<string, any> | null = null
  ssrError: Error | null = null
  lastHMRTimestamp = 0
  lastInvalidationTimestamp = 0

  /**
   * @param setIsSelfAccepting - set `false` to set `isSelfAccepting` later. e.g. #7870
   */
  constructor(url: string, setIsSelfAccepting = true) {
    this.url = url
    this.type = isDirectCSSRequest(url) ? 'css' : 'js'
    if (setIsSelfAccepting) {
      this.isSelfAccepting = false
    }
  }

  get importedModules(): Set<ModuleNode> {
    const importedModules = new Set(this.clientImportedModules)
    for (const module of this.ssrImportedModules) {
      importedModules.add(module)
    }
    return importedModules
  }
}

export type ResolvedUrl = [
  url: string,
  resolvedId: string,
  meta: object | null | undefined,
]

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  fileToModulesMap = new Map<string, Set<ModuleNode>>()
  safeModulesPath = new Set<string>()

  /**
   * @internal
   */
  _unresolvedUrlToModuleMap = new Map<
    string,
    Promise<ModuleNode> | ModuleNode
  >()
  /**
   * @internal
   */
  _ssrUnresolvedUrlToModuleMap = new Map<
    string,
    Promise<ModuleNode> | ModuleNode
  >()

  constructor(
    private resolveId: (
      url: string,
      ssr: boolean,
    ) => Promise<PartialResolvedId | null>,
  ) {}

  async getModuleByUrl(
    rawUrl: string,
    ssr?: boolean,
  ): Promise<ModuleNode | undefined> {
    // Quick path, if we already have a module for this rawUrl (even without extension)
    rawUrl = removeImportQuery(removeTimestampQuery(rawUrl))
    const mod = this._getUnresolvedUrlToModule(rawUrl, ssr)
    if (mod) {
      return mod
    }

    const [url] = await this._resolveUrl(rawUrl, ssr)
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

  invalidateModule(
    mod: ModuleNode,
    seen: Set<ModuleNode> = new Set(),
    timestamp: number = Date.now(),
    isHmr: boolean = false,
    hmrBoundaries: ModuleNode[] = [],
  ): void {
    if (seen.has(mod)) {
      return
    }
    seen.add(mod)
    if (isHmr) {
      mod.lastHMRTimestamp = timestamp
    } else {
      // Save the timestamp for this invalidation, so we can avoid caching the result of possible already started
      // processing being done for this module
      mod.lastInvalidationTimestamp = timestamp
    }
    // Don't invalidate mod.info and mod.meta, as they are part of the processing pipeline
    // Invalidating the transform result is enough to ensure this module is re-processed next time it is requested
    mod.transformResult = null
    mod.ssrTransformResult = null
    mod.ssrModule = null
    mod.ssrError = null

    // https://github.com/vitejs/vite/issues/3033
    // Given b.js -> c.js -> b.js (arrow means top-level import), if c.js self-accepts
    // and refetches itself, the execution order becomes c.js -> b.js -> c.js. The import
    // order matters here as it will fail. The workaround for now is to not hmr invalidate
    // b.js so that c.js refetches the already cached b.js, skipping the import loop.
    if (hmrBoundaries.includes(mod)) {
      return
    }
    mod.importers.forEach((importer) => {
      if (!importer.acceptedHmrDeps.has(mod)) {
        this.invalidateModule(importer, seen, timestamp, isHmr)
      }
    })
  }

  invalidateAll(): void {
    const timestamp = Date.now()
    const seen = new Set<ModuleNode>()
    this.idToModuleMap.forEach((mod) => {
      this.invalidateModule(mod, seen, timestamp)
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
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | ModuleNode>,
    acceptedExports: Set<string> | null,
    isSelfAccepting: boolean,
    ssr?: boolean,
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = ssr ? mod.ssrImportedModules : mod.clientImportedModules
    let noLongerImported: Set<ModuleNode> | undefined

    let resolvePromises = []
    let resolveResults = new Array(importedModules.size)
    let index = 0
    // update import graph
    for (const imported of importedModules) {
      const nextIndex = index++
      if (typeof imported === 'string') {
        resolvePromises.push(
          this.ensureEntryFromUrl(imported, ssr).then((dep) => {
            dep.importers.add(mod)
            resolveResults[nextIndex] = dep
          }),
        )
      } else {
        imported.importers.add(mod)
        resolveResults[nextIndex] = imported
      }
    }

    if (resolvePromises.length) {
      await Promise.all(resolvePromises)
    }

    const nextImports = new Set(resolveResults)
    if (ssr) {
      mod.ssrImportedModules = nextImports
    } else {
      mod.clientImportedModules = nextImports
    }

    // remove the importer from deps that were imported but no longer are.
    prevImports.forEach((dep) => {
      if (
        !mod.clientImportedModules.has(dep) &&
        !mod.ssrImportedModules.has(dep)
      ) {
        dep.importers.delete(mod)
        if (!dep.importers.size) {
          // dependency no longer imported
          ;(noLongerImported || (noLongerImported = new Set())).add(dep)
        }
      }
    })

    // update accepted hmr deps
    resolvePromises = []
    resolveResults = new Array(acceptedModules.size)
    index = 0
    for (const accepted of acceptedModules) {
      const nextIndex = index++
      if (typeof accepted === 'string') {
        resolvePromises.push(
          this.ensureEntryFromUrl(accepted, ssr).then((dep) => {
            resolveResults[nextIndex] = dep
          }),
        )
      } else {
        resolveResults[nextIndex] = accepted
      }
    }

    if (resolvePromises.length) {
      await Promise.all(resolvePromises)
    }

    mod.acceptedHmrDeps = new Set(resolveResults)

    // update accepted hmr exports
    mod.acceptedHmrExports = acceptedExports
    mod.importedBindings = importedBindings
    return noLongerImported
  }

  async ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    setIsSelfAccepting = true,
  ): Promise<ModuleNode> {
    return this._ensureEntryFromUrl(rawUrl, ssr, setIsSelfAccepting)
  }

  /**
   * @internal
   */
  async _ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    setIsSelfAccepting = true,
    // Optimization, avoid resolving the same url twice if the caller already did it
    resolved?: PartialResolvedId,
  ): Promise<ModuleNode> {
    // Quick path, if we already have a module for this rawUrl (even without extension)
    rawUrl = removeImportQuery(removeTimestampQuery(rawUrl))
    let mod = this._getUnresolvedUrlToModule(rawUrl, ssr)
    if (mod) {
      return mod
    }
    const modPromise = (async () => {
      const [url, resolvedId, meta] = await this._resolveUrl(
        rawUrl,
        ssr,
        resolved,
      )
      mod = this.idToModuleMap.get(resolvedId)
      if (!mod) {
        mod = new ModuleNode(url, setIsSelfAccepting)
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
      // multiple urls can map to the same module and id, make sure we register
      // the url to the existing module in that case
      else if (!this.urlToModuleMap.has(url)) {
        this.urlToModuleMap.set(url, mod)
      }
      this._setUnresolvedUrlToModule(rawUrl, mod, ssr)
      return mod
    })()

    // Also register the clean url to the module, so that we can short-circuit
    // resolving the same url twice
    this._setUnresolvedUrlToModule(rawUrl, modPromise, ssr)
    return modPromise
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
  // 1. remove the HMR timestamp query (?t=xxxx) and the ?import query
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    url = removeImportQuery(removeTimestampQuery(url))
    const mod = await this._getUnresolvedUrlToModule(url, ssr)
    if (mod?.id) {
      return [mod.url, mod.id, mod.meta]
    }
    return this._resolveUrl(url, ssr)
  }

  /**
   * @internal
   */
  _getUnresolvedUrlToModule(
    url: string,
    ssr?: boolean,
  ): Promise<ModuleNode> | ModuleNode | undefined {
    return (
      ssr ? this._ssrUnresolvedUrlToModuleMap : this._unresolvedUrlToModuleMap
    ).get(url)
  }
  /**
   * @internal
   */
  _setUnresolvedUrlToModule(
    url: string,
    mod: Promise<ModuleNode> | ModuleNode,
    ssr?: boolean,
  ): void {
    ;(ssr
      ? this._ssrUnresolvedUrlToModuleMap
      : this._unresolvedUrlToModuleMap
    ).set(url, mod)
  }

  /**
   * @internal
   */
  async _resolveUrl(
    url: string,
    ssr?: boolean,
    alreadyResolved?: PartialResolvedId,
  ): Promise<ResolvedUrl> {
    const resolved = alreadyResolved ?? (await this.resolveId(url, !!ssr))
    const resolvedId = resolved?.id || url
    if (
      url !== resolvedId &&
      !url.includes('\0') &&
      !url.startsWith(`virtual:`)
    ) {
      const ext = extname(cleanUrl(resolvedId))
      if (ext) {
        const pathname = cleanUrl(url)
        if (!pathname.endsWith(ext)) {
          url = pathname + ext + url.slice(pathname.length)
        }
      }
    }
    return [url, resolvedId, resolved?.meta]
  }
}
