import { extname } from 'node:path'
import type { ModuleInfo, PartialResolvedId } from 'rollup'
import { isDirectCSSRequest } from '../plugins/css'
import {
  normalizePath,
  removeImportQuery,
  removeTimestampQuery,
} from '../utils'
import { FS_PREFIX } from '../constants'
import { cleanUrl } from '../../shared/utils'
import type { TransformResult } from './transformRequest'

export class EnvironmentModuleNode {
  environment: string
  /**
   * Public served url path, starts with /
   */
  url: string
  /**
   * Resolved file system path + query
   */
  id: string | null = null // TODO: remove null
  file: string | null = null
  type: 'js' | 'css'
  info?: ModuleInfo
  meta?: Record<string, any>
  importers = new Set<EnvironmentModuleNode>()

  importedModules = new Set<EnvironmentModuleNode>()

  acceptedHmrDeps = new Set<EnvironmentModuleNode>()
  acceptedHmrExports: Set<string> | null = null
  importedBindings: Map<string, Set<string>> | null = null
  isSelfAccepting?: boolean
  transformResult: TransformResult | null = null

  module: Record<string, any> | null = null
  error: Error | null = null

  lastHMRTimestamp = 0
  lastInvalidationTimestamp = 0
  /**
   * If the module only needs to update its imports timestamp (e.g. within an HMR chain),
   * it is considered soft-invalidated. In this state, its `transformResult` should exist,
   * and the next `transformRequest` for this module will replace the timestamps.
   *
   * By default the value is `undefined` if it's not soft/hard-invalidated. If it gets
   * soft-invalidated, this will contain the previous `transformResult` value. If it gets
   * hard-invalidated, this will be set to `'HARD_INVALIDATED'`.
   * @internal
   */
  invalidationState: TransformResult | 'HARD_INVALIDATED' | undefined
  /**
   * The module urls that are statically imported in the code. This information is separated
   * out from `importedModules` as only importers that statically import the module can be
   * soft invalidated. Other imports (e.g. watched files) needs the importer to be hard invalidated.
   * @internal
   */
  staticImportedUrls?: Set<string>

  /**
   * @param setIsSelfAccepting - set `false` to set `isSelfAccepting` later. e.g. #7870
   */
  constructor(url: string, environment: string, setIsSelfAccepting = true) {
    this.environment = environment
    this.url = url
    this.type = isDirectCSSRequest(url) ? 'css' : 'js'
    if (setIsSelfAccepting) {
      this.isSelfAccepting = false
    }
  }
}

export type ResolvedUrl = [
  url: string,
  resolvedId: string,
  meta: object | null | undefined,
]

export class EnvironmentModuleGraph {
  environment: string

  urlToModuleMap = new Map<string, EnvironmentModuleNode>()
  idToModuleMap = new Map<string, EnvironmentModuleNode>()
  etagToModuleMap = new Map<string, EnvironmentModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  fileToModulesMap = new Map<string, Set<EnvironmentModuleNode>>()

  /**
   * @internal
   */
  _unresolvedUrlToModuleMap = new Map<
    string,
    Promise<EnvironmentModuleNode> | EnvironmentModuleNode
  >()

  /**
   * @internal
   */
  _resolveId: (url: string) => Promise<PartialResolvedId | null>

  constructor(
    environment: string,
    resolveId: (url: string) => Promise<PartialResolvedId | null>,
  ) {
    this.environment = environment
    this._resolveId = resolveId
  }

  async getModuleByUrl(
    rawUrl: string,
  ): Promise<EnvironmentModuleNode | undefined> {
    // Quick path, if we already have a module for this rawUrl (even without extension)
    rawUrl = removeImportQuery(removeTimestampQuery(rawUrl))
    const mod = this._getUnresolvedUrlToModule(rawUrl)
    if (mod) {
      return mod
    }

    const [url] = await this._resolveUrl(rawUrl)
    return this.urlToModuleMap.get(url)
  }

  getModuleById(id: string): EnvironmentModuleNode | undefined {
    return this.idToModuleMap.get(removeTimestampQuery(id))
  }

  getModulesByFile(file: string): Set<EnvironmentModuleNode> | undefined {
    return this.fileToModulesMap.get(file)
  }

  onFileChange(file: string): void {
    const mods = this.getModulesByFile(file)
    if (mods) {
      const seen = new Set<EnvironmentModuleNode>()
      mods.forEach((mod) => {
        this.invalidateModule(mod, seen)
      })
    }
  }

  invalidateModule(
    mod: EnvironmentModuleNode,
    seen: Set<EnvironmentModuleNode> = new Set(),
    timestamp: number = Date.now(),
    isHmr: boolean = false,
    /** @internal */
    softInvalidate = false,
  ): void {
    const prevInvalidationState = mod.invalidationState
    // const prevSsrInvalidationState = mod.ssrInvalidationState

    // Handle soft invalidation before the `seen` check, as consecutive soft/hard invalidations can
    // cause the final soft invalidation state to be different.
    // If soft invalidated, save the previous `transformResult` so that we can reuse and transform the
    // import timestamps only in `transformRequest`. If there's no previous `transformResult`, hard invalidate it.
    if (softInvalidate) {
      mod.invalidationState ??= mod.transformResult ?? 'HARD_INVALIDATED'
    }
    // If hard invalidated, further soft invalidations have no effect until it's reset to `undefined`
    else {
      mod.invalidationState = 'HARD_INVALIDATED'
    }

    // Skip updating the module if it was already invalidated before and the invalidation state has not changed
    if (
      seen.has(mod) &&
      prevInvalidationState === mod.invalidationState
      // && prevSsrInvalidationState === mod.ssrInvalidationState
    ) {
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
    const etag = mod.transformResult?.etag
    if (etag) this.etagToModuleMap.delete(etag)

    mod.transformResult = null
    mod.module = null
    mod.error = null

    mod.importers.forEach((importer) => {
      if (!importer.acceptedHmrDeps.has(mod)) {
        // If the importer statically imports the current module, we can soft-invalidate the importer
        // to only update the import timestamps. If it's not statically imported, e.g. watched/glob file,
        // we can only soft invalidate if the current module was also soft-invalidated. A soft-invalidation
        // doesn't need to trigger a re-load and re-transform of the importer.
        const shouldSoftInvalidateImporter =
          importer.staticImportedUrls?.has(mod.url) || softInvalidate
        this.invalidateModule(
          importer,
          seen,
          timestamp,
          isHmr,
          shouldSoftInvalidateImporter,
        )
      }
    })
  }

  invalidateAll(): void {
    const timestamp = Date.now()
    const seen = new Set<EnvironmentModuleNode>()
    this.idToModuleMap.forEach((mod) => {
      this.invalidateModule(mod, seen, timestamp)
    })
  }

  /**
   * Update the module graph based on a module's updated imports information
   * If there are dependencies that no longer have any importers, they are
   * returned as a Set.
   *
   * @param staticImportedUrls Subset of `importedModules` where they're statically imported in code.
   *   This is only used for soft invalidations so `undefined` is fine but may cause more runtime processing.
   */
  async updateModuleInfo(
    mod: EnvironmentModuleNode,
    importedModules: Set<string | EnvironmentModuleNode>,
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | EnvironmentModuleNode>,
    acceptedExports: Set<string> | null,
    isSelfAccepting: boolean,
    /** @internal */
    staticImportedUrls?: Set<string>,
  ): Promise<Set<EnvironmentModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = mod.importedModules
    let noLongerImported: Set<EnvironmentModuleNode> | undefined

    let resolvePromises = []
    let resolveResults = new Array(importedModules.size)
    let index = 0
    // update import graph
    for (const imported of importedModules) {
      const nextIndex = index++
      if (typeof imported === 'string') {
        resolvePromises.push(
          this.ensureEntryFromUrl(imported).then((dep) => {
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
    mod.importedModules = nextImports

    // remove the importer from deps that were imported but no longer are.
    prevImports.forEach((dep) => {
      if (!mod.importedModules.has(dep)) {
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
          this.ensureEntryFromUrl(accepted).then((dep) => {
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
    mod.staticImportedUrls = staticImportedUrls

    // update accepted hmr exports
    mod.acceptedHmrExports = acceptedExports
    mod.importedBindings = importedBindings
    return noLongerImported
  }

  async ensureEntryFromUrl(
    rawUrl: string,
    setIsSelfAccepting = true,
  ): Promise<EnvironmentModuleNode> {
    return this._ensureEntryFromUrl(rawUrl, setIsSelfAccepting)
  }

  /**
   * @internal
   */
  async _ensureEntryFromUrl(
    rawUrl: string,
    setIsSelfAccepting = true,
    // Optimization, avoid resolving the same url twice if the caller already did it
    resolved?: PartialResolvedId,
  ): Promise<EnvironmentModuleNode> {
    // Quick path, if we already have a module for this rawUrl (even without extension)
    rawUrl = removeImportQuery(removeTimestampQuery(rawUrl))
    let mod = this._getUnresolvedUrlToModule(rawUrl)
    if (mod) {
      return mod
    }
    const modPromise = (async () => {
      const [url, resolvedId, meta] = await this._resolveUrl(rawUrl, resolved)
      mod = this.idToModuleMap.get(resolvedId)
      if (!mod) {
        mod = new EnvironmentModuleNode(
          url,
          this.environment,
          setIsSelfAccepting,
        )
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
      this._setUnresolvedUrlToModule(rawUrl, mod)
      return mod
    })()

    // Also register the clean url to the module, so that we can short-circuit
    // resolving the same url twice
    this._setUnresolvedUrlToModule(rawUrl, modPromise)
    return modPromise
  }

  // some deps, like a css file referenced via @import, don't have its own
  // url because they are inlined into the main css import. But they still
  // need to be represented in the module graph so that they can trigger
  // hmr in the importing css file.
  createFileOnlyEntry(file: string): EnvironmentModuleNode {
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

    const mod = new EnvironmentModuleNode(url, this.environment)
    mod.file = file
    fileMappedModules.add(mod)
    return mod
  }

  // for incoming urls, it is important to:
  // 1. remove the HMR timestamp query (?t=xxxx) and the ?import query
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  async resolveUrl(url: string): Promise<ResolvedUrl> {
    url = removeImportQuery(removeTimestampQuery(url))
    const mod = await this._getUnresolvedUrlToModule(url)
    if (mod?.id) {
      return [mod.url, mod.id, mod.meta]
    }
    return this._resolveUrl(url)
  }

  updateModuleTransformResult(
    mod: EnvironmentModuleNode,
    result: TransformResult | null,
  ): void {
    if (this.environment === 'browser') {
      const prevEtag = mod.transformResult?.etag
      if (prevEtag) this.etagToModuleMap.delete(prevEtag)
      if (result?.etag) this.etagToModuleMap.set(result.etag, mod)
    }

    mod.transformResult = result
  }

  getModuleByEtag(etag: string): EnvironmentModuleNode | undefined {
    return this.etagToModuleMap.get(etag)
  }

  /**
   * @internal
   */
  _getUnresolvedUrlToModule(
    url: string,
  ): Promise<EnvironmentModuleNode> | EnvironmentModuleNode | undefined {
    return this._unresolvedUrlToModuleMap.get(url)
  }
  /**
   * @internal
   */
  _setUnresolvedUrlToModule(
    url: string,
    mod: Promise<EnvironmentModuleNode> | EnvironmentModuleNode,
  ): void {
    this._unresolvedUrlToModuleMap.set(url, mod)
  }

  /**
   * @internal
   */
  async _resolveUrl(
    url: string,
    alreadyResolved?: PartialResolvedId,
  ): Promise<ResolvedUrl> {
    const resolved = alreadyResolved ?? (await this._resolveId(url))
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

export class ModuleNode {
  _moduleGraph: ModuleGraph
  _browserModule: EnvironmentModuleNode | undefined
  _nodeModule: EnvironmentModuleNode | undefined
  constructor(
    moduleGraph: ModuleGraph,
    browserModule?: EnvironmentModuleNode,
    nodeModule?: EnvironmentModuleNode,
  ) {
    this._moduleGraph = moduleGraph
    this._browserModule = browserModule
    this._nodeModule = nodeModule
  }
  _get<T extends keyof EnvironmentModuleNode>(
    prop: T,
  ): EnvironmentModuleNode[T] {
    return (this._browserModule?.[prop] ?? this._nodeModule?.[prop])!
  }
  _wrapModuleSet(
    prop: ModuleSetNames,
    module: EnvironmentModuleNode | undefined,
  ): Set<ModuleNode> {
    if (!module) {
      return new Set()
    }
    return createBackwardCompatibleModuleSet(this._moduleGraph, prop, module)
  }
  _getModuleSetUnion(prop: 'importedModules' | 'importers'): Set<ModuleNode> {
    // A good approximation to the previous logic that returned the union of
    // the importedModules and importers from both the browser and server
    const importedModules = new Set<ModuleNode>()
    const ids = new Set<string>()
    if (this._browserModule) {
      for (const mod of this._browserModule[prop]) {
        if (mod.id) ids.add(mod.id)
        importedModules.add(
          this._moduleGraph.getBackwardCompatibleModuleNode(mod),
        )
      }
    }
    if (this._nodeModule) {
      for (const mod of this._nodeModule[prop]) {
        if (mod.id && !ids.has(mod.id)) {
          importedModules.add(
            this._moduleGraph.getBackwardCompatibleModuleNode(mod),
          )
        }
      }
    }
    return importedModules
  }
  get url(): string {
    return this._get('url')
  }
  get id(): string | null {
    return this._get('id')
  }
  get file(): string | null {
    return this._get('file')
  }
  get type(): 'js' | 'css' {
    return this._get('type')
  }
  get info(): ModuleInfo | undefined {
    return this._get('info')
  }
  get meta(): Record<string, any> | undefined {
    return this._get('meta')
  }
  get importers(): Set<ModuleNode> {
    return this._getModuleSetUnion('importers')
  }
  get clientImportedModules(): Set<ModuleNode> {
    return this._wrapModuleSet('importedModules', this._browserModule)
  }
  get ssrImportedModules(): Set<ModuleNode> {
    return this._wrapModuleSet('importedModules', this._nodeModule)
  }
  get importedModules(): Set<ModuleNode> {
    return this._getModuleSetUnion('importedModules')
  }
  get acceptedHmrDeps(): Set<ModuleNode> {
    return this._wrapModuleSet('acceptedHmrDeps', this._browserModule)
  }
  get acceptedHmrExports(): Set<string> | null {
    return this._browserModule?.acceptedHmrExports ?? null
  }
  get importedBindings(): Map<string, Set<string>> | null {
    return this._browserModule?.importedBindings ?? null
  }
  get isSelfAccepting(): boolean | undefined {
    return this._browserModule?.isSelfAccepting
  }
  get transformResult(): TransformResult | null {
    return this._browserModule?.transformResult ?? null
  }
  set transformResult(value: TransformResult | null) {
    if (this._browserModule) {
      this._browserModule.transformResult = value
    }
  }
  get ssrTransformResult(): TransformResult | null {
    return this._nodeModule?.transformResult ?? null
  }
  set ssrTransformResult(value: TransformResult | null) {
    if (this._nodeModule) {
      this._nodeModule.transformResult = value
    }
  }
  get ssrModule(): Record<string, any> | null {
    return this._nodeModule?.module ?? null
  }
  get ssrError(): Error | null {
    return this._nodeModule?.error ?? null
  }
  get lastHMRTimestamp(): number {
    return this._browserModule?.lastHMRTimestamp ?? 0
  }
  set lastHMRTimestamp(value: number) {
    if (this._browserModule) {
      this._browserModule.lastHMRTimestamp = value
    }
  }
  get lastInvalidationTimestamp(): number {
    return this._browserModule?.lastInvalidationTimestamp ?? 0
  }
  get invalidationState(): TransformResult | 'HARD_INVALIDATED' | undefined {
    return this._browserModule?.invalidationState
  }
  get ssrInvalidationState(): TransformResult | 'HARD_INVALIDATED' | undefined {
    return this._nodeModule?.invalidationState
  }
}

function mapIterator<T, K = T>(
  iterable: IterableIterator<T>,
  transform: (value: T) => K,
): IterableIterator<K> {
  return {
    [Symbol.iterator](): IterableIterator<K> {
      return this
    },
    next(): IteratorResult<K> {
      const r = iterable.next()
      return r.done
        ? r
        : {
            value: transform(r.value),
            done: false,
          }
    },
  }
}

export class ModuleGraph {
  runtime = 'mixed'

  /** @internal */
  _browser: EnvironmentModuleGraph

  /** @internal */
  _node: EnvironmentModuleGraph

  urlToModuleMap: Map<string, ModuleNode>
  idToModuleMap: Map<string, ModuleNode>
  etagToModuleMap: Map<string, ModuleNode>

  fileToModulesMap: Map<string, Set<ModuleNode>>

  constructor(moduleGraphs: {
    browser: EnvironmentModuleGraph
    node: EnvironmentModuleGraph
  }) {
    this._browser = moduleGraphs.browser
    this._node = moduleGraphs.node

    const getModuleMapUnion =
      (prop: 'urlToModuleMap' | 'idToModuleMap') => () => {
        // A good approximation to the previous logic that returned the union of
        // the importedModules and importers from both the browser and server
        if (this._node[prop].size === 0) {
          return this._browser[prop]
        }
        const map = new Map(this._browser[prop])
        for (const [key, module] of this._node[prop]) {
          if (!map.has(key)) {
            map.set(key, module)
          }
        }
        return map
      }

    this.urlToModuleMap = createBackwardCompatibleModuleMap(
      this,
      'urlToModuleMap',
      getModuleMapUnion('urlToModuleMap'),
    )
    this.idToModuleMap = createBackwardCompatibleModuleMap(
      this,
      'idToModuleMap',
      getModuleMapUnion('idToModuleMap'),
    )
    this.etagToModuleMap = createBackwardCompatibleModuleMap(
      this,
      'etagToModuleMap',
      () => this._browser.etagToModuleMap,
    )
    this.fileToModulesMap = createBackwardCompatibleFileToModulesMap(this)
  }

  /** @deprecated */
  getModuleById(id: string): ModuleNode | undefined {
    const browserModule = this._browser.getModuleById(id)
    const nodeModule = this._node.getModuleById(id)
    if (!browserModule && !nodeModule) {
      return
    }
    return this.getBackwardCompatibleModuleNodeDual(browserModule, nodeModule)
  }

  /** @deprecated */
  async getModuleByUrl(
    url: string,
    ssr?: boolean,
  ): Promise<ModuleNode | undefined> {
    // In the mixed graph, the ssr flag was used to resolve the id.
    const [browserModule, nodeModule] = await Promise.all([
      this._browser.getModuleByUrl(url),
      this._node.getModuleByUrl(url),
    ])
    if (!browserModule && !nodeModule) {
      return
    }
    return this.getBackwardCompatibleModuleNodeDual(browserModule, nodeModule)
  }

  /** @deprecated */
  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    // Until Vite 5.1.x, the moduleGraph contained modules from both the browser and server
    // We maintain backwards compatibility by returning a Set of module proxies assuming
    // that the modules for a certain file are the same in both the browser and server
    const browserModules = this._browser.getModulesByFile(file)
    if (browserModules) {
      return new Set(
        [...browserModules].map(
          (mod) => this.getBackwardCompatibleBrowserModuleNode(mod)!,
        ),
      )
    }
    const nodeModules = this._node.getModulesByFile(file)
    if (nodeModules) {
      return new Set(
        [...nodeModules].map(
          (mod) => this.getBackwardCompatibleServerModuleNode(mod)!,
        ),
      )
    }
    return undefined
  }

  /** @deprecated */
  onFileChange(file: string): void {
    this._browser.onFileChange(file)
    this._node.onFileChange(file)
  }

  /** @internal */
  _getModuleGraph(environment: string): EnvironmentModuleGraph {
    switch (environment) {
      case 'browser':
        return this._browser
      case 'node':
        return this._node
      default:
        throw new Error(`Invalid module node runtime ${environment}`)
    }
  }

  /** @deprecated */
  invalidateModule(
    mod: ModuleNode,
    seen: Set<ModuleNode> = new Set(),
    timestamp: number = Date.now(),
    isHmr: boolean = false,
    /** @internal */
    softInvalidate = false,
  ): void {
    if (mod._browserModule) {
      this._getModuleGraph('browser').invalidateModule(
        mod._browserModule,
        new Set(
          [...seen].map((mod) => mod._browserModule).filter(Boolean),
        ) as Set<EnvironmentModuleNode>,
        timestamp,
        isHmr,
        softInvalidate,
      )
    }
    if (mod._nodeModule) {
      // TODO: Maybe this isn't needed?
      this._getModuleGraph('node').invalidateModule(
        mod._nodeModule,
        new Set(
          [...seen].map((mod) => mod._nodeModule).filter(Boolean),
        ) as Set<EnvironmentModuleNode>,
        timestamp,
        isHmr,
        softInvalidate,
      )
    }
  }

  /** @deprecated */
  invalidateAll(): void {
    this._browser.invalidateAll()
    this._node.invalidateAll()
  }

  /* TODO: I don't know if we need to implement this method (or how to do it yet)
  async updateModuleInfo(
    module: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | ModuleNode>,
    acceptedExports: Set<string> | null,
    isSelfAccepting: boolean,
    ssr?: boolean,
    staticImportedUrls?: Set<string>, // internal
  ): Promise<Set<ModuleNode> | undefined> {
    const modules = await this._getModuleGraph(
      module.environment,
    ).updateModuleInfo(
      module,
      importedModules, // ?
      importedBindings,
      acceptedModules, // ?
      acceptedExports,
      isSelfAccepting,
      staticImportedUrls,
    )
    return modules
      ? new Set(
          [...modules].map((mod) => this.getBackwardCompatibleModuleNode(mod)!),
        )
      : undefined
  }
  */

  /** @deprecated */
  async ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    setIsSelfAccepting = true,
  ): Promise<ModuleNode> {
    const module = await (ssr ? this._node : this._browser).ensureEntryFromUrl(
      rawUrl,
      setIsSelfAccepting,
    )
    return this.getBackwardCompatibleModuleNode(module)!
  }

  /** @deprecated */
  createFileOnlyEntry(file: string): ModuleNode {
    const browserModule = this._browser.createFileOnlyEntry(file)
    const nodeModule = this._node.createFileOnlyEntry(file)
    return this.getBackwardCompatibleModuleNodeDual(browserModule, nodeModule)!
  }

  /** @deprecated */
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    return ssr ? this._node.resolveUrl(url) : this._browser.resolveUrl(url)
  }

  /** @deprecated */
  updateModuleTransformResult(
    mod: ModuleNode,
    result: TransformResult | null,
    ssr?: boolean,
  ): void {
    const environment = ssr ? 'node' : 'browser'
    this._getModuleGraph(environment).updateModuleTransformResult(
      (environment === 'browser' ? mod._browserModule : mod._nodeModule)!,
      result,
    )
  }

  /** @deprecated */
  getModuleByEtag(etag: string): ModuleNode | undefined {
    const mod = this._browser.etagToModuleMap.get(etag)
    return mod && this.getBackwardCompatibleBrowserModuleNode(mod)
  }

  getBackwardCompatibleBrowserModuleNode(
    browserModule: EnvironmentModuleNode,
  ): ModuleNode {
    return this.getBackwardCompatibleModuleNodeDual(
      browserModule,
      browserModule.id ? this._node.getModuleById(browserModule.id) : undefined,
    )
  }

  getBackwardCompatibleServerModuleNode(
    nodeModule: EnvironmentModuleNode,
  ): ModuleNode {
    return this.getBackwardCompatibleModuleNodeDual(
      nodeModule.id ? this._browser.getModuleById(nodeModule.id) : undefined,
      nodeModule,
    )
  }

  getBackwardCompatibleModuleNode(mod: EnvironmentModuleNode): ModuleNode {
    return mod.environment === 'browser'
      ? this.getBackwardCompatibleBrowserModuleNode(mod)
      : this.getBackwardCompatibleServerModuleNode(mod)
  }

  getBackwardCompatibleModuleNodeDual(
    browserModule?: EnvironmentModuleNode,
    nodeModule?: EnvironmentModuleNode,
  ): ModuleNode {
    // ...
    return new ModuleNode(this, browserModule, nodeModule)
  }
}

type ModuleSetNames = 'acceptedHmrDeps' | 'importedModules'

function createBackwardCompatibleModuleSet(
  moduleGraph: ModuleGraph,
  prop: ModuleSetNames,
  module: EnvironmentModuleNode,
): Set<ModuleNode> {
  return {
    [Symbol.iterator]() {
      return this.keys()
    },
    has(key) {
      if (!key.id) {
        return false
      }
      const keyModule = moduleGraph
        ._getModuleGraph(module.environment)
        .getModuleById(key.id)
      return keyModule !== undefined && module[prop].has(keyModule)
    },
    values() {
      return this.keys()
    },
    keys() {
      return mapIterator(module[prop].keys(), (mod) =>
        moduleGraph.getBackwardCompatibleModuleNode(mod),
      )
    },
    get size() {
      return module[prop].size
    },
    forEach(callback, thisArg) {
      return module[prop].forEach((mod) => {
        const backwardCompatibleMod =
          moduleGraph.getBackwardCompatibleModuleNode(mod)
        callback.call(
          thisArg,
          backwardCompatibleMod,
          backwardCompatibleMod,
          this,
        )
      })
    },
    // TODO: should we implement all the set methods?
    // missing: add, clear, delete, difference, intersection, isDisjointFrom,
    // isSubsetOf, isSupersetOf, symmetricDifference, union
  } as Set<ModuleNode>
}

function createBackwardCompatibleModuleMap(
  moduleGraph: ModuleGraph,
  prop: 'urlToModuleMap' | 'idToModuleMap' | 'etagToModuleMap',
  getModuleMap: () => Map<string, EnvironmentModuleNode>,
): Map<string, ModuleNode> {
  return {
    [Symbol.iterator]() {
      return this.entries()
    },
    get(key) {
      const browserModule = moduleGraph._browser[prop].get(key)
      const nodeModule = moduleGraph._node[prop].get(key)
      if (!browserModule && !nodeModule) {
        return
      }
      return moduleGraph.getBackwardCompatibleModuleNodeDual(
        browserModule,
        nodeModule,
      )
    },
    keys() {
      return getModuleMap().keys()
    },
    values() {
      return mapIterator(getModuleMap().values(), (mod) =>
        moduleGraph.getBackwardCompatibleModuleNode(mod),
      )
    },
    entries() {
      return mapIterator(getModuleMap().entries(), ([key, mod]) => [
        key,
        moduleGraph.getBackwardCompatibleModuleNode(mod),
      ])
    },
    get size() {
      // TODO: Should we use Math.max(moduleGraph._browser[prop].size, moduleGraph._node[prop].size)
      // for performance? I don't think there are many use cases of this method
      return getModuleMap().size
    },
    forEach(callback, thisArg) {
      return getModuleMap().forEach((mod, key) => {
        const backwardCompatibleMod =
          moduleGraph.getBackwardCompatibleModuleNode(mod)
        callback.call(thisArg, backwardCompatibleMod, key, this)
      })
    },
  } as Map<string, ModuleNode>
}

function createBackwardCompatibleFileToModulesMap(
  moduleGraph: ModuleGraph,
): Map<string, Set<ModuleNode>> {
  const getFileToModulesMap = (): Map<string, Set<EnvironmentModuleNode>> => {
    // A good approximation to the previous logic that returned the union of
    // the importedModules and importers from both the browser and server
    if (!moduleGraph._node.fileToModulesMap.size) {
      return moduleGraph._browser.fileToModulesMap
    }
    const map = new Map(moduleGraph._browser.fileToModulesMap)
    for (const [key, modules] of moduleGraph._node.fileToModulesMap) {
      const modulesSet = map.get(key)
      if (!modulesSet) {
        map.set(key, modules)
      } else {
        for (const nodeModule of modules) {
          let hasModule = false
          for (const browserModule of modulesSet) {
            hasModule ||= browserModule.id === nodeModule.id
            if (hasModule) {
              break
            }
          }
          if (!hasModule) {
            modulesSet.add(nodeModule)
          }
        }
      }
    }
    return map
  }
  const getBackwardCompatibleModules = (
    modules: Set<EnvironmentModuleNode>,
  ): Set<ModuleNode> =>
    new Set(
      [...modules].map((mod) =>
        moduleGraph.getBackwardCompatibleModuleNode(mod),
      ),
    )

  return {
    [Symbol.iterator]() {
      return this.entries()
    },
    get(key) {
      const browserModules = moduleGraph._browser.fileToModulesMap.get(key)
      const nodeModules = moduleGraph._node.fileToModulesMap.get(key)
      if (!browserModules && !nodeModules) {
        return
      }
      const modules = browserModules ?? new Set<EnvironmentModuleNode>()
      if (nodeModules) {
        for (const nodeModule of nodeModules) {
          if (nodeModule.id) {
            let found = false
            for (const mod of modules) {
              found ||= mod.id === nodeModule.id
              if (found) {
                break
              }
            }
            if (!found) {
              modules?.add(nodeModule)
            }
          }
        }
      }
      return getBackwardCompatibleModules(modules)
    },
    keys() {
      return getFileToModulesMap().keys()
    },
    values() {
      return mapIterator(
        getFileToModulesMap().values(),
        getBackwardCompatibleModules,
      )
    },
    entries() {
      return mapIterator(getFileToModulesMap().entries(), ([key, modules]) => [
        key,
        getBackwardCompatibleModules(modules),
      ])
    },
    get size() {
      return getFileToModulesMap().size
    },
    forEach(callback, thisArg) {
      return getFileToModulesMap().forEach((modules, key) => {
        callback.call(thisArg, getBackwardCompatibleModules(modules), key, this)
      })
    },
  } as Map<string, Set<ModuleNode>>
}
