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
  runtime: string
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
  // clientImportedModules = new Set<ModuleNode>()
  // ssrImportedModules = new Set<ModuleNode>()

  acceptedHmrDeps = new Set<ModuleNode>()
  acceptedHmrExports: Set<string> | null = null
  importedBindings: Map<string, Set<string>> | null = null
  isSelfAccepting?: boolean
  transformResult: TransformResult | null = null

  // ssrTransformResult: TransformResult | null = null
  // ssrModule: Record<string, any> | null = null
  // ssrError: Error | null = null

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
   * @internal
   */
  // ssrInvalidationState: TransformResult | 'HARD_INVALIDATED' | undefined
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
  constructor(url: string, runtime: string, setIsSelfAccepting = true) {
    this.runtime = runtime
    this.url = url
    this.type = isDirectCSSRequest(url) ? 'css' : 'js'
    if (setIsSelfAccepting) {
      this.isSelfAccepting = false
    }
  }

  /*
  get importedModules(): Set<ModuleNode> {
    const importedModules = new Set(this.clientImportedModules)
    for (const module of this.ssrImportedModules) {
      importedModules.add(module)
    }
    return importedModules
  }
  */
}

export type ResolvedUrl = [
  url: string,
  resolvedId: string,
  meta: object | null | undefined,
]

export class ModuleGraph {
  runtime: string

  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()
  etagToModuleMap = new Map<string, ModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  fileToModulesMap = new Map<string, Set<ModuleNode>>()

  // TODO: this property should be shared across all module graphs
  safeModulesPath = new Set<string>()

  /**
   * @internal
   */
  _unresolvedUrlToModuleMap = new Map<
    string,
    Promise<ModuleNode> | ModuleNode
  >()

  constructor(
    runtime: string,
    private resolveId: (url: string) => Promise<PartialResolvedId | null>,
  ) {
    this.runtime = runtime
  }

  async getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined> {
    // Quick path, if we already have a module for this rawUrl (even without extension)
    rawUrl = removeImportQuery(removeTimestampQuery(rawUrl))
    const mod = this._getUnresolvedUrlToModule(rawUrl)
    if (mod) {
      return mod
    }

    const [url] = await this._resolveUrl(rawUrl)
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
      // mod.ssrInvalidationState ??= mod.ssrTransformResult ?? 'HARD_INVALIDATED'
    }
    // If hard invalidated, further soft invalidations have no effect until it's reset to `undefined`
    else {
      mod.invalidationState = 'HARD_INVALIDATED'
      // mod.ssrInvalidationState = 'HARD_INVALIDATED'
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
    // mod.ssrTransformResult = null
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
    const seen = new Set<ModuleNode>()
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
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | ModuleNode>,
    acceptedExports: Set<string> | null,
    isSelfAccepting: boolean,
    /** @internal */
    staticImportedUrls?: Set<string>,
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = mod.importedModules
    let noLongerImported: Set<ModuleNode> | undefined

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
  ): Promise<ModuleNode> {
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
  ): Promise<ModuleNode> {
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
        mod = new ModuleNode(url, this.runtime, setIsSelfAccepting)
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

    const mod = new ModuleNode(url, this.runtime)
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
    mod: ModuleNode,
    result: TransformResult | null,
  ): void {
    if (this.runtime === 'browser') {
      const prevEtag = mod.transformResult?.etag
      if (prevEtag) this.etagToModuleMap.delete(prevEtag)
      if (result?.etag) this.etagToModuleMap.set(result.etag, mod)
    }

    mod.transformResult = result
  }

  getModuleByEtag(etag: string): ModuleNode | undefined {
    return this.etagToModuleMap.get(etag)
  }

  /**
   * @internal
   */
  _getUnresolvedUrlToModule(
    url: string,
  ): Promise<ModuleNode> | ModuleNode | undefined {
    return this._unresolvedUrlToModuleMap.get(url)
  }
  /**
   * @internal
   */
  _setUnresolvedUrlToModule(
    url: string,
    mod: Promise<ModuleNode> | ModuleNode,
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
    const resolved = alreadyResolved ?? (await this.resolveId(url))
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

interface BackwardCompatibleModuleNode extends ModuleNode {
  clientImportedModules: Set<ModuleNode>
  ssrImportedModules: Set<ModuleNode>
  ssrTransformResult: TransformResult | null
  ssrModule: Record<string, any> | null
  ssrError: Error | null
  // TODO: ssrInvalidationState?
}

/** @internal */
function getBackwardCompatibleModuleNode(
  browserModule?: ModuleNode,
  serverModule?: ModuleNode,
): ModuleNode | undefined {
  return browserModule || serverModule
    ? new Proxy((browserModule || serverModule)!, {
        get(_, prop: keyof BackwardCompatibleModuleNode) {
          if (prop === 'clientImportedModules') {
            return browserModule?.importedModules
          } else if (prop === 'ssrImportedModules') {
            return serverModule?.importedModules
          } else if (prop === 'importedModules') {
            return new Set([
              ...(browserModule?.importedModules || []),
              ...(serverModule?.importedModules || []),
            ])
          } else if (prop === 'ssrTransformResult') {
            return serverModule?.transformResult
          } else if (prop === 'ssrModule') {
            return serverModule?.module
          } else if (prop === 'ssrError') {
            return serverModule?.error
          }
          return browserModule?.[prop] ?? serverModule?.[prop]
        },
      })
    : undefined
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

function createBackwardCompatibleModuleMap(
  browser: ModuleGraph,
  server: ModuleGraph,
  prop: 'urlToModuleMap' | 'idToModuleMap' | 'etagToModuleMap',
): Map<string, ModuleNode> {
  return {
    get(key: string) {
      const browserModule = browser[prop].get(key)
      const serverModule = server[prop].get(key)
      return getBackwardCompatibleModuleNode(browserModule, serverModule)
    },
    keys(): IterableIterator<string> {
      // TODO: should we return the keys from both the browser and server?
      return browser[prop].size ? browser[prop].keys() : server[prop].keys()
    },
    values(): IterableIterator<ModuleNode> {
      return browser[prop].size
        ? mapIterator(
            browser[prop].values(),
            (browserModule) =>
              getBackwardCompatibleModuleNode(
                browserModule,
                browserModule.id
                  ? server.getModuleById(browserModule.id)
                  : undefined,
              )!,
          )
        : mapIterator(
            server[prop].values(),
            (serverModule) =>
              getBackwardCompatibleModuleNode(undefined, serverModule)!,
          )
    },
    entries(): IterableIterator<[string, ModuleNode]> {
      return browser[prop].size
        ? mapIterator(browser[prop].entries(), ([key, browserModule]) => [
            key,
            getBackwardCompatibleModuleNode(
              browserModule,
              browserModule.id
                ? server.getModuleById(browserModule.id)
                : undefined,
            )!,
          ])
        : mapIterator(server[prop].entries(), ([key, serverModule]) => [
            key,
            getBackwardCompatibleModuleNode(undefined, serverModule)!,
          ])
    },
    get size() {
      return browser[prop].size || server[prop].size
    },
  } as Map<string, ModuleNode>
}

function createBackwardCompatibleFileToModulesMap(
  browser: ModuleGraph,
  server: ModuleGraph,
): Map<string, Set<ModuleNode>> {
  const mapBrowserModules = (
    browserModules: Set<ModuleNode>,
  ): Set<ModuleNode> =>
    new Set(
      [...browserModules].map(
        (browserModule) =>
          getBackwardCompatibleModuleNode(
            browserModule,
            browserModule.id
              ? server.getModuleById(browserModule.id)
              : undefined,
          )!,
      ),
    )
  const mapMaybeBrowserModules = (
    browserModules: Set<ModuleNode> | undefined,
  ): Set<ModuleNode> | undefined =>
    browserModules ? mapBrowserModules(browserModules) : undefined
  return {
    get(key: string) {
      return mapMaybeBrowserModules(browser.fileToModulesMap.get(key))
    },
    keys(): IterableIterator<string> {
      // TODO: should we return the keys from both the browser and server?
      return browser.fileToModulesMap.size
        ? browser.fileToModulesMap.keys()
        : server.fileToModulesMap.keys()
    },
    values(): IterableIterator<Set<ModuleNode>> {
      return mapIterator(browser.fileToModulesMap.values(), mapBrowserModules)
    },
    entries(): IterableIterator<[string, Set<ModuleNode>]> {
      return mapIterator(
        browser.fileToModulesMap.entries(),
        ([key, browserModules]) => [key, mapBrowserModules(browserModules)],
      )
    },
    get size() {
      return browser.fileToModulesMap.size || server.fileToModulesMap.size
    },
  } as Map<string, Set<ModuleNode>>
}

export class ModuleGraphs {
  // Added so ModuleGraphs is a ModuleGraph
  runtime = 'mixed'

  browser: ModuleGraph
  server: ModuleGraph
  runtimes: string[]

  urlToModuleMap: Map<string, ModuleNode>
  idToModuleMap = new Map<string, ModuleNode>()
  etagToModuleMap = new Map<string, ModuleNode>()

  fileToModulesMap = new Map<string, Set<ModuleNode>>()

  get safeModulesPath(): Set<string> {
    return this.browser.safeModulesPath
  }

  constructor(
    moduleGraphs: { browser: ModuleGraph; server: ModuleGraph },
    private resolveId: (
      url: string,
    ) => Promise<PartialResolvedId | null> = async (url) => null,
  ) {
    this.resolveId('')

    this.browser = moduleGraphs.browser
    this.server = moduleGraphs.server
    this.runtimes = Object.keys(moduleGraphs)

    this.urlToModuleMap = createBackwardCompatibleModuleMap(
      this.browser,
      this.server,
      'urlToModuleMap',
    )
    this.idToModuleMap = createBackwardCompatibleModuleMap(
      this.browser,
      this.server,
      'idToModuleMap',
    )
    this.etagToModuleMap = createBackwardCompatibleModuleMap(
      this.browser,
      this.server,
      'etagToModuleMap',
    )

    this.fileToModulesMap = createBackwardCompatibleFileToModulesMap(
      this.browser,
      this.server,
    )
  }

  get(runtime: string): ModuleGraph {
    // TODO: how to properly type runtime so we can use moduleGraph[runtime]
    return runtime === 'browser' ? this.browser : this.server
  }

  /** @deprecated */
  getModuleById(id: string): ModuleNode | undefined {
    const browserModule = this.browser.getModuleById(id)
    const serverModule = this.server.getModuleById(id)
    return getBackwardCompatibleModuleNode(browserModule, serverModule)
  }

  /** @deprecated */
  async getModuleByUrl(
    url: string,
    ssr?: boolean,
  ): Promise<ModuleNode | undefined> {
    // In the mixed graph, the ssr flag was used to resolve the id.
    // TODO: check if it is more compatible to only get the module from the browser
    // or server depending on the ssr flag. For now, querying for both modules
    // seems to me closer to what we did before.
    const [browserModule, serverModule] = await Promise.all([
      this.browser.getModuleByUrl(url),
      this.server.getModuleByUrl(url),
    ])
    return getBackwardCompatibleModuleNode(browserModule, serverModule)
  }

  /** @deprecated */
  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    // Until Vite 5.1.x, the moduleGraph contained modules from both the browser and server
    // We maintain backwards compatibility by returning a Set of module proxies assuming
    // that the modules for a certain file are the same in both the browser and server
    const browserModules = this.browser.getModulesByFile(file)
    if (browserModules) {
      return new Set(
        [...browserModules].map(
          (module) =>
            getBackwardCompatibleModuleNode(
              module,
              module.id ? this.server.getModuleById(module.id) : undefined,
            )!,
        ),
      )
    }
    const serverModules = this.server.getModulesByFile(file)
    if (serverModules) {
      return new Set(
        [...serverModules].map(
          (module) => getBackwardCompatibleModuleNode(undefined, module)!,
        ),
      )
    }
    return undefined
  }

  /** @deprecated */
  onFileChange(file: string): void {
    this.browser.onFileChange(file)
    this.server.onFileChange(file)
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
    this.get(mod.runtime).invalidateModule(
      mod,
      seen,
      timestamp,
      isHmr,
      softInvalidate,
    )
  }

  /** @deprecated */
  invalidateAll(): void {
    this.browser.invalidateAll()
    this.server.invalidateAll()
  }

  /** @deprecated */
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    importedBindings: Map<string, Set<string>> | null,
    acceptedModules: Set<string | ModuleNode>,
    acceptedExports: Set<string> | null,
    isSelfAccepting: boolean,
    ssr?: boolean,
    /** @internal */
    staticImportedUrls?: Set<string>,
  ): Promise<Set<ModuleNode> | undefined> {
    // TODO: return backward compatible module nodes?
    const modules = await (ssr ? this.server : this.browser).updateModuleInfo(
      mod,
      importedModules,
      importedBindings,
      acceptedModules,
      acceptedExports,
      isSelfAccepting,
      staticImportedUrls,
    )
    return modules
      ? new Set(
          [...modules].map((module) =>
            ssr
              ? getBackwardCompatibleModuleNode(
                  module.id ? this.server.getModuleById(module.id) : undefined,
                  module,
                )!
              : getBackwardCompatibleModuleNode(
                  module,
                  module.id ? this.server.getModuleById(module.id) : undefined,
                )!,
          ),
        )
      : undefined
  }

  /** @deprecated */
  async ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    setIsSelfAccepting = true,
  ): Promise<ModuleNode> {
    // TODO: should we only ensure the entry on the browser or server depending on the ssr flag?
    const [browserModule, serverModule] = await Promise.all([
      this.browser.ensureEntryFromUrl(rawUrl, setIsSelfAccepting),
      this.server.ensureEntryFromUrl(rawUrl, setIsSelfAccepting),
    ])
    return getBackwardCompatibleModuleNode(browserModule, serverModule)!
  }

  /** @deprecated */
  createFileOnlyEntry(file: string): ModuleNode {
    const browserModule = this.browser.createFileOnlyEntry(file)
    const serverModule = this.browser.createFileOnlyEntry(file)
    return getBackwardCompatibleModuleNode(browserModule, serverModule)!
  }

  /** @deprecated */
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    return ssr ? this.server.resolveUrl(url) : this.browser.resolveUrl(url)
  }

  /** @deprecated */
  updateModuleTransformResult(
    mod: ModuleNode,
    result: TransformResult | null,
    ssr: boolean,
  ): void {
    this.get(mod.runtime).updateModuleTransformResult(mod, result)
  }

  /** @deprecated */
  getModuleByEtag(etag: string): ModuleNode | undefined {
    const mod = this.browser.etagToModuleMap.get(etag)
    if (!mod) {
      return
    }
    return getBackwardCompatibleModuleNode(
      mod,
      this.server.getModuleById(mod.id!),
    )
  }
}
