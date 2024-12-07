import type { ModuleInfo } from 'rollup'
import type { TransformResult } from './transformRequest'
import type {
  EnvironmentModuleGraph,
  EnvironmentModuleNode,
  ResolvedUrl,
} from './moduleGraph'

/**
 * Backward compatible ModuleNode and ModuleGraph with mixed nodes from both the client and ssr environments
 * It would be good to take the types names for the new EnvironmentModuleNode and EnvironmentModuleGraph but we can't
 * do that at this point without breaking to much code in the ecosystem.
 * We are going to deprecate these types and we can try to use them back in the future.
 */

// same default value of "moduleInfo.meta" as in Rollup
const EMPTY_OBJECT = Object.freeze({})

export class ModuleNode {
  _moduleGraph: ModuleGraph
  _clientModule: EnvironmentModuleNode | undefined
  _ssrModule: EnvironmentModuleNode | undefined
  constructor(
    moduleGraph: ModuleGraph,
    clientModule?: EnvironmentModuleNode,
    ssrModule?: EnvironmentModuleNode,
  ) {
    this._moduleGraph = moduleGraph
    this._clientModule = clientModule
    this._ssrModule = ssrModule
  }
  _get<T extends keyof EnvironmentModuleNode>(
    prop: T,
  ): EnvironmentModuleNode[T] {
    return (this._clientModule?.[prop] ?? this._ssrModule?.[prop])!
  }
  _set<T extends keyof EnvironmentModuleNode>(
    prop: T,
    value: EnvironmentModuleNode[T],
  ): void {
    if (this._clientModule) {
      this._clientModule[prop] = value
    }
    if (this._ssrModule) {
      this._ssrModule[prop] = value
    }
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
    if (this._clientModule) {
      for (const mod of this._clientModule[prop]) {
        if (mod.id) ids.add(mod.id)
        importedModules.add(
          this._moduleGraph.getBackwardCompatibleModuleNode(mod),
        )
      }
    }
    if (this._ssrModule) {
      for (const mod of this._ssrModule[prop]) {
        if (mod.id && !ids.has(mod.id)) {
          importedModules.add(
            this._moduleGraph.getBackwardCompatibleModuleNode(mod),
          )
        }
      }
    }
    return importedModules
  }
  _getModuleInfoUnion(prop: 'info'): ModuleInfo | undefined {
    const _clientValue = this._clientModule?.[prop]
    const _ssrValue = this._ssrModule?.[prop]

    if (_clientValue == null && _ssrValue == null) return undefined

    return new Proxy({} as any, {
      get: (_, key: string) => {
        // `meta` refers to `ModuleInfo.meta` so we refer to `this.meta` to
        // handle the object union between client and ssr
        if (key === 'meta') {
          return this.meta || EMPTY_OBJECT
        }
        if (_clientValue) {
          if (key in _clientValue) {
            return _clientValue[key as keyof ModuleInfo]
          }
        }
        if (_ssrValue) {
          if (key in _ssrValue) {
            return _ssrValue[key as keyof ModuleInfo]
          }
        }
      },
    })
  }
  _getModuleObjectUnion(prop: 'meta'): Record<string, any> | undefined {
    const _clientValue = this._clientModule?.[prop]
    const _ssrValue = this._ssrModule?.[prop]

    if (_clientValue == null && _ssrValue == null) return undefined

    const info: Record<string, any> = {}
    if (_ssrValue) {
      Object.assign(info, _ssrValue)
    }
    if (_clientValue) {
      Object.assign(info, _clientValue)
    }
    return info
  }

  get url(): string {
    return this._get('url')
  }
  set url(value: string) {
    this._set('url', value)
  }
  get id(): string | null {
    return this._get('id')
  }
  set id(value: string | null) {
    this._set('id', value)
  }
  get file(): string | null {
    return this._get('file')
  }
  set file(value: string | null) {
    this._set('file', value)
  }
  get type(): 'js' | 'css' {
    return this._get('type')
  }
  // `info` needs special care as it's defined as a proxy in `pluginContainer`,
  // so we also merge it as a proxy too
  get info(): ModuleInfo | undefined {
    return this._getModuleInfoUnion('info')
  }
  get meta(): Record<string, any> | undefined {
    return this._getModuleObjectUnion('meta')
  }
  get importers(): Set<ModuleNode> {
    return this._getModuleSetUnion('importers')
  }
  get clientImportedModules(): Set<ModuleNode> {
    return this._wrapModuleSet('importedModules', this._clientModule)
  }
  get ssrImportedModules(): Set<ModuleNode> {
    return this._wrapModuleSet('importedModules', this._ssrModule)
  }
  get importedModules(): Set<ModuleNode> {
    return this._getModuleSetUnion('importedModules')
  }
  get acceptedHmrDeps(): Set<ModuleNode> {
    return this._wrapModuleSet('acceptedHmrDeps', this._clientModule)
  }
  get acceptedHmrExports(): Set<string> | null {
    return this._clientModule?.acceptedHmrExports ?? null
  }
  get importedBindings(): Map<string, Set<string>> | null {
    return this._clientModule?.importedBindings ?? null
  }
  get isSelfAccepting(): boolean | undefined {
    return this._clientModule?.isSelfAccepting
  }
  get transformResult(): TransformResult | null {
    return this._clientModule?.transformResult ?? null
  }
  set transformResult(value: TransformResult | null) {
    if (this._clientModule) {
      this._clientModule.transformResult = value
    }
  }
  get ssrTransformResult(): TransformResult | null {
    return this._ssrModule?.transformResult ?? null
  }
  set ssrTransformResult(value: TransformResult | null) {
    if (this._ssrModule) {
      this._ssrModule.transformResult = value
    }
  }
  get ssrModule(): Record<string, any> | null {
    return this._ssrModule?.ssrModule ?? null
  }
  get ssrError(): Error | null {
    return this._ssrModule?.ssrError ?? null
  }
  get lastHMRTimestamp(): number {
    return Math.max(
      this._clientModule?.lastHMRTimestamp ?? 0,
      this._ssrModule?.lastHMRTimestamp ?? 0,
    )
  }
  set lastHMRTimestamp(value: number) {
    if (this._clientModule) {
      this._clientModule.lastHMRTimestamp = value
    }
    if (this._ssrModule) {
      this._ssrModule.lastHMRTimestamp = value
    }
  }
  get lastInvalidationTimestamp(): number {
    return Math.max(
      this._clientModule?.lastInvalidationTimestamp ?? 0,
      this._ssrModule?.lastInvalidationTimestamp ?? 0,
    )
  }
  get invalidationState(): TransformResult | 'HARD_INVALIDATED' | undefined {
    return this._clientModule?.invalidationState
  }
  get ssrInvalidationState(): TransformResult | 'HARD_INVALIDATED' | undefined {
    return this._ssrModule?.invalidationState
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
  /** @internal */
  _moduleGraphs: {
    client: () => EnvironmentModuleGraph
    ssr: () => EnvironmentModuleGraph
  }

  /** @internal */
  get _client(): EnvironmentModuleGraph {
    return this._moduleGraphs.client()
  }

  /** @internal */
  get _ssr(): EnvironmentModuleGraph {
    return this._moduleGraphs.ssr()
  }

  urlToModuleMap: Map<string, ModuleNode>
  idToModuleMap: Map<string, ModuleNode>
  etagToModuleMap: Map<string, ModuleNode>

  fileToModulesMap: Map<string, Set<ModuleNode>>

  private moduleNodeCache = new DualWeakMap<
    EnvironmentModuleNode,
    EnvironmentModuleNode,
    ModuleNode
  >()

  constructor(moduleGraphs: {
    client: () => EnvironmentModuleGraph
    ssr: () => EnvironmentModuleGraph
  }) {
    this._moduleGraphs = moduleGraphs

    const getModuleMapUnion =
      (prop: 'urlToModuleMap' | 'idToModuleMap') => () => {
        // A good approximation to the previous logic that returned the union of
        // the importedModules and importers from both the browser and server
        if (this._ssr[prop].size === 0) {
          return this._client[prop]
        }
        const map = new Map(this._client[prop])
        for (const [key, module] of this._ssr[prop]) {
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
      () => this._client.etagToModuleMap,
    )
    this.fileToModulesMap = createBackwardCompatibleFileToModulesMap(this)
  }

  getModuleById(id: string): ModuleNode | undefined {
    const clientModule = this._client.getModuleById(id)
    const ssrModule = this._ssr.getModuleById(id)
    if (!clientModule && !ssrModule) {
      return
    }
    return this.getBackwardCompatibleModuleNodeDual(clientModule, ssrModule)
  }

  async getModuleByUrl(
    url: string,
    _ssr?: boolean,
  ): Promise<ModuleNode | undefined> {
    // In the mixed graph, the ssr flag was used to resolve the id.
    const [clientModule, ssrModule] = await Promise.all([
      this._client.getModuleByUrl(url),
      this._ssr.getModuleByUrl(url),
    ])
    if (!clientModule && !ssrModule) {
      return
    }
    return this.getBackwardCompatibleModuleNodeDual(clientModule, ssrModule)
  }

  getModulesByFile(file: string): Set<ModuleNode> | undefined {
    // Until Vite 5.1.x, the moduleGraph contained modules from both the browser and server
    // We maintain backwards compatibility by returning a Set of module proxies assuming
    // that the modules for a certain file are the same in both the browser and server
    const clientModules = this._client.getModulesByFile(file)
    const ssrModules = this._ssr.getModulesByFile(file)
    if (!clientModules && !ssrModules) {
      return undefined
    }
    const result = new Set<ModuleNode>()
    if (clientModules) {
      for (const mod of clientModules) {
        result.add(this.getBackwardCompatibleBrowserModuleNode(mod)!)
      }
    }
    if (ssrModules) {
      for (const mod of ssrModules) {
        if (mod.id == null || !this._client.getModuleById(mod.id)) {
          result.add(this.getBackwardCompatibleServerModuleNode(mod)!)
        }
      }
    }
    return result
  }

  onFileChange(file: string): void {
    this._client.onFileChange(file)
    this._ssr.onFileChange(file)
  }

  onFileDelete(file: string): void {
    this._client.onFileDelete(file)
    this._ssr.onFileDelete(file)
  }

  /** @internal */
  _getModuleGraph(environment: string): EnvironmentModuleGraph {
    switch (environment) {
      case 'client':
        return this._client
      case 'ssr':
        return this._ssr
      default:
        throw new Error(`Invalid module node environment ${environment}`)
    }
  }

  invalidateModule(
    mod: ModuleNode,
    seen = new Set<ModuleNode>(),
    timestamp: number = Date.now(),
    isHmr: boolean = false,
    /** @internal */
    softInvalidate = false,
  ): void {
    if (mod._clientModule) {
      this._client.invalidateModule(
        mod._clientModule,
        new Set(
          [...seen].map((mod) => mod._clientModule).filter(Boolean),
        ) as Set<EnvironmentModuleNode>,
        timestamp,
        isHmr,
        softInvalidate,
      )
    }
    if (mod._ssrModule) {
      // TODO: Maybe this isn't needed?
      this._ssr.invalidateModule(
        mod._ssrModule,
        new Set(
          [...seen].map((mod) => mod._ssrModule).filter(Boolean),
        ) as Set<EnvironmentModuleNode>,
        timestamp,
        isHmr,
        softInvalidate,
      )
    }
  }

  invalidateAll(): void {
    this._client.invalidateAll()
    this._ssr.invalidateAll()
  }

  /* TODO: It seems there isn't usage of this method in the ecosystem
     Waiting to check if we really need this for backwards compatibility
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
    // Not implemented
  }
  */

  async ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    setIsSelfAccepting = true,
  ): Promise<ModuleNode> {
    const module = await (ssr ? this._ssr : this._client).ensureEntryFromUrl(
      rawUrl,
      setIsSelfAccepting,
    )
    return this.getBackwardCompatibleModuleNode(module)!
  }

  createFileOnlyEntry(file: string): ModuleNode {
    const clientModule = this._client.createFileOnlyEntry(file)
    const ssrModule = this._ssr.createFileOnlyEntry(file)
    return this.getBackwardCompatibleModuleNodeDual(clientModule, ssrModule)!
  }

  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    return ssr ? this._ssr.resolveUrl(url) : this._client.resolveUrl(url)
  }

  updateModuleTransformResult(
    mod: ModuleNode,
    result: TransformResult | null,
    ssr?: boolean,
  ): void {
    const environment = ssr ? 'ssr' : 'client'
    this._getModuleGraph(environment).updateModuleTransformResult(
      (environment === 'client' ? mod._clientModule : mod._ssrModule)!,
      result,
    )
  }

  getModuleByEtag(etag: string): ModuleNode | undefined {
    const mod = this._client.etagToModuleMap.get(etag)
    return mod && this.getBackwardCompatibleBrowserModuleNode(mod)
  }

  getBackwardCompatibleBrowserModuleNode(
    clientModule: EnvironmentModuleNode,
  ): ModuleNode {
    return this.getBackwardCompatibleModuleNodeDual(
      clientModule,
      clientModule.id ? this._ssr.getModuleById(clientModule.id) : undefined,
    )
  }

  getBackwardCompatibleServerModuleNode(
    ssrModule: EnvironmentModuleNode,
  ): ModuleNode {
    return this.getBackwardCompatibleModuleNodeDual(
      ssrModule.id ? this._client.getModuleById(ssrModule.id) : undefined,
      ssrModule,
    )
  }

  getBackwardCompatibleModuleNode(mod: EnvironmentModuleNode): ModuleNode {
    return mod.environment === 'client'
      ? this.getBackwardCompatibleBrowserModuleNode(mod)
      : this.getBackwardCompatibleServerModuleNode(mod)
  }

  getBackwardCompatibleModuleNodeDual(
    clientModule?: EnvironmentModuleNode,
    ssrModule?: EnvironmentModuleNode,
  ): ModuleNode {
    const cached = this.moduleNodeCache.get(clientModule, ssrModule)
    if (cached) {
      return cached
    }

    const moduleNode = new ModuleNode(this, clientModule, ssrModule)
    this.moduleNodeCache.set(clientModule, ssrModule, moduleNode)
    return moduleNode
  }
}

class DualWeakMap<K1 extends WeakKey, K2 extends WeakKey, V> {
  private map = new WeakMap<K1 | object, WeakMap<K2 | object, V>>()
  private undefinedKey = {}

  get(key1: K1 | undefined, key2: K2 | undefined): V | undefined {
    const k1 = key1 ?? this.undefinedKey
    const k2 = key2 ?? this.undefinedKey
    return this.map.get(k1)?.get(k2)
  }

  set(key1: K1 | undefined, key2: K2 | undefined, value: V): void {
    const k1 = key1 ?? this.undefinedKey
    const k2 = key2 ?? this.undefinedKey
    if (!this.map.has(k1)) {
      this.map.set(k1, new Map<K2, V>())
    }

    const m = this.map.get(k1)!
    m.set(k2, value)
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
    // There are several methods missing. We can implement them if downstream
    // projects are relying on them: add, clear, delete, difference, intersection,
    // sDisjointFrom, isSubsetOf, isSupersetOf, symmetricDifference, union
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
      const clientModule = moduleGraph._client[prop].get(key)
      const ssrModule = moduleGraph._ssr[prop].get(key)
      if (!clientModule && !ssrModule) {
        return
      }
      return moduleGraph.getBackwardCompatibleModuleNodeDual(
        clientModule,
        ssrModule,
      )
    },
    set(key, mod) {
      const clientModule = mod._clientModule
      if (clientModule) {
        moduleGraph._client[prop].set(key, clientModule)
      }
      const ssrModule = mod._ssrModule
      if (ssrModule) {
        moduleGraph._ssr[prop].set(key, ssrModule)
      }
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
    if (!moduleGraph._ssr.fileToModulesMap.size) {
      return moduleGraph._client.fileToModulesMap
    }
    const map = new Map(moduleGraph._client.fileToModulesMap)
    for (const [key, modules] of moduleGraph._ssr.fileToModulesMap) {
      const modulesSet = map.get(key)
      if (!modulesSet) {
        map.set(key, modules)
      } else {
        for (const ssrModule of modules) {
          let hasModule = false
          for (const clientModule of modulesSet) {
            hasModule ||= clientModule.id === ssrModule.id
            if (hasModule) {
              break
            }
          }
          if (!hasModule) {
            modulesSet.add(ssrModule)
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
      const clientModules = moduleGraph._client.fileToModulesMap.get(key)
      const ssrModules = moduleGraph._ssr.fileToModulesMap.get(key)
      if (!clientModules && !ssrModules) {
        return
      }
      const modules = clientModules ?? new Set<EnvironmentModuleNode>()
      if (ssrModules) {
        for (const ssrModule of ssrModules) {
          if (ssrModule.id) {
            let found = false
            for (const mod of modules) {
              found ||= mod.id === ssrModule.id
              if (found) {
                break
              }
            }
            if (!found) {
              modules.add(ssrModule)
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
