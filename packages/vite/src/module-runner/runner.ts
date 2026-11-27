import { nanoid } from 'nanoid/non-secure'
import { DevRuntime } from 'rolldown/experimental/runtime'
import type { Update } from '#types/hmrPayload'
import type { ModuleNamespace } from '#types/hot'
import { createIsBuiltin } from '../shared/builtin'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from '../shared/bundledDevHmr'
import { HMRClient, HMRContext, type HMRLogger } from '../shared/hmr'
import {
  type NormalizedModuleRunnerTransport,
  normalizeModuleRunnerTransport,
} from '../shared/moduleRunnerTransport'
import { analyzeImportedModDifference } from '../shared/ssrTransform'
import { cleanUrl, isPrimitive } from '../shared/utils'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrExportNameKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
  ssrRolldownRuntimeKey,
} from './constants'
import { createDefaultImportMeta } from './createImportMeta'
import { ESModulesEvaluator } from './esmEvaluator'
import type { EvaluatedModuleNode } from './evaluatedModules'
import { EvaluatedModules } from './evaluatedModules'
import { createHMRHandlerForRunner } from './hmrHandler'
import { hmrLogger, silentConsole } from './hmrLogger'
import { enableSourceMapSupport } from './sourcemap/index'
import type {
  ModuleEvaluator,
  ModuleRunnerContext,
  ModuleRunnerOptions,
  ResolvedResult,
  SSRImportMetadata,
} from './types'
import { posixDirname, posixJoin } from './utils'

interface ModuleRunnerDebugger {
  (formatter: unknown, ...args: unknown[]): void
}

interface ModuleGraph {
  modules: EvaluatedModules
  requests: Map<string, Promise<EvaluatedModuleNode>>
  detached: boolean
  hotContexts: Map<string, HMRContext>
}

export class ModuleRunner {
  public evaluatedModules: EvaluatedModules
  public hmrClient?: HMRClient
  /**
   * Set instead of a plain `hmrClient` when `rolldownRuntime` is enabled.
   * @internal
   */
  public _bundledDevHmrClient?: BundledDevHMRClient

  private readonly transport: NormalizedModuleRunnerTransport
  private readonly resetSourceMapSupport?: () => void
  private moduleGraph: ModuleGraph
  private readonly moduleGraphs = new WeakMap<
    EvaluatedModuleNode,
    ModuleGraph
  >()
  private isBuiltin?: (id: string) => boolean
  private builtinsPromise?: Promise<void>
  // Owned by the runner rather than bootstrapped from the bundle: the modules
  // receive it as the `__rolldown_runtime__` argument, so it has to exist
  // before the first one runs. It is per-runner on purpose — `ssrLoadModule`
  // has its own compat runner, and a global would collide.
  private rolldownDevRuntime?: DevRuntime

  private closed = false

  constructor(
    public options: ModuleRunnerOptions,
    public evaluator: ModuleEvaluator = new ESModulesEvaluator(),
    private debug?: ModuleRunnerDebugger | undefined,
  ) {
    this.evaluatedModules = options.evaluatedModules ?? new EvaluatedModules()
    this.moduleGraph = {
      modules: this.evaluatedModules,
      requests: new Map(),
      detached: false,
      hotContexts: new Map(),
    }
    this.transport = normalizeModuleRunnerTransport(options.transport)
    // independent of HMR: the bundle needs `__rolldown_runtime__` to execute
    // at all, so the runtime exists even when HMR is disabled
    let runtime: DevRuntime | undefined
    if (options.rolldownRuntime) {
      runtime = this.rolldownDevRuntime = this.createRolldownDevRuntime()
    }
    if (options.hmr !== false) {
      const optionsHmr = options.hmr ?? true
      const resolvedHmrLogger: HMRLogger =
        optionsHmr === true || optionsHmr.logger === undefined
          ? hmrLogger
          : optionsHmr.logger === false
            ? silentConsole
            : optionsHmr.logger
      const importUpdatedModule = ({ acceptedPath }: Update) =>
        this.import<ModuleNamespace>(acceptedPath)
      if (runtime) {
        this.hmrClient = this._bundledDevHmrClient = new BundledDevHMRClient(
          resolvedHmrLogger,
          this.transport,
          runtime,
          {
            partialAccept:
              optionsHmr !== true && optionsHmr.partialAccept === true,
            loadPatch: async (url) => {
              await this.import(url)
              // don't leave the HMR patch in memory
              const patchModule = this.evaluatedModules.getModuleByUrl(url)
              if (patchModule) {
                this.evaluatedModules.removeModule(patchModule)
              }
            },
            beforeApply: () => 'continue',
            importUpdatedModule,
          },
        )
      } else {
        this.hmrClient = new HMRClient(
          resolvedHmrLogger,
          this.transport,
          importUpdatedModule,
        )
      }
      if (!this.transport.connect) {
        throw new Error(
          'HMR is not supported by this runner transport, but `hmr` option was set to true',
        )
      }
      this.transport.connect(createHMRHandlerForRunner(this))
    } else {
      this.transport.connect?.()
    }
    if (runtime) {
      // registers this runner with the dev engine so it gets its own ship map
      this.transport.send({
        type: 'custom',
        event: 'vite:client-connected',
        data: { clientId: runtime.clientId },
      })
    }
    if (options.sourcemapInterceptor !== false) {
      this.resetSourceMapSupport = enableSourceMapSupport(this)
    }
  }

  /**
   * URL to execute. Accepts file path, server path or id relative to the root.
   */
  public async import<T = any>(url: string): Promise<T> {
    const fetchedModule = await this.cachedModule(url)
    const exportsObject = await this.cachedRequest(
      fetchedModule.url,
      fetchedModule,
    )
    if (
      this.rolldownDevRuntime &&
      fetchedModule.meta &&
      'rolldownModuleId' in fetchedModule.meta &&
      fetchedModule.meta.rolldownModuleId &&
      this.rolldownDevRuntime.isExecuted(fetchedModule.meta.rolldownModuleId)
    ) {
      const loadedExports = this.rolldownDevRuntime.loadExports(
        fetchedModule.meta.rolldownModuleId,
      )
      fetchedModule.exports = loadedExports
      return loadedExports
    }
    return exportsObject
  }

  /**
   * Clear all caches including HMR listeners.
   */
  public clearCache(): void {
    this.clearModuleCache()
    this.hmrClient?.clear()
  }

  /** @internal */
  public clearModuleCache(): void {
    // Pending evaluations retain their module nodes, including dependencies
    // that finished before the reload. Keep resolving their later imports in
    // that graph while new public imports use the cleared, public cache.
    this.moduleGraph.modules = new EvaluatedModules(this.evaluatedModules)
    this.moduleGraph.detached = true
    this.evaluatedModules.clear()
    this.moduleGraph = {
      modules: this.evaluatedModules,
      requests: new Map(),
      detached: false,
      hotContexts: new Map(),
    }
  }

  /** @internal */
  public async _resetBundledDevRuntime(): Promise<void> {
    this.evaluatedModules.clear()
    this.moduleGraph.hotContexts.clear()

    const oldClientId = this.rolldownDevRuntime!.clientId
    const runtime = this.createRolldownDevRuntime()
    await this._bundledDevHmrClient!.resetForFullReload(runtime)
    this.rolldownDevRuntime = runtime
    await this.transport.invoke('resetBundledDevClient', [
      oldClientId,
      runtime.clientId,
    ])
  }

  /**
   * Clears all caches, removes all HMR listeners, and resets source map support.
   * This method doesn't stop the HMR connection.
   */
  public async close(): Promise<void> {
    this.resetSourceMapSupport?.()
    this.clearCache()
    this.hmrClient = undefined
    this._bundledDevHmrClient = undefined
    this.closed = true
    await this.transport.disconnect?.()
  }

  /**
   * Returns `true` if the runtime has been closed by calling `close()` method.
   */
  public isClosed(): boolean {
    return this.closed
  }

  private processImport(
    exports: Record<string, any>,
    fetchResult: ResolvedResult,
    metadata?: SSRImportMetadata,
  ) {
    if (!('externalize' in fetchResult)) {
      return exports
    }
    const { url, type } = fetchResult
    if (type !== 'module' && type !== 'commonjs') return exports
    analyzeImportedModDifference(exports, url, type, metadata)
    return exports
  }

  private isCircularRequest(
    mod: EvaluatedModuleNode,
    callstack: string[],
    graph: ModuleGraph,
    visited = new Set<string>(),
  ): boolean {
    if (visited.has(mod.id)) {
      return false
    }
    visited.add(mod.id)

    for (const importedModuleId of mod.imports) {
      const importedModule = graph.modules.getModuleById(importedModuleId)
      if (!importedModule?.promise || importedModule.evaluated) {
        continue
      }

      if (callstack.includes(importedModuleId)) {
        return true
      }

      if (this.isCircularRequest(importedModule, callstack, graph, visited)) {
        return true
      }
    }

    return false
  }

  private async cachedRequest(
    url: string,
    mod: EvaluatedModuleNode,
    callstack: string[] = [],
    metadata?: SSRImportMetadata,
  ): Promise<any> {
    const meta = mod.meta!
    const moduleId = meta.id

    const importee = callstack.at(-1)

    if (importee) mod.importers.add(importee)

    // fast path: already evaluated modules can't deadlock
    if (mod.evaluated && mod.promise) {
      return this.processImport(await mod.promise, meta, metadata)
    }

    if (mod.promise) {
      if (
        mod.exports &&
        (callstack.includes(moduleId) ||
          this.isCircularRequest(
            mod,
            callstack,
            this.moduleGraphs.get(mod) ?? this.moduleGraph,
          ))
      ) {
        return this.processImport(mod.exports, meta, metadata)
      }
      return this.processImport(await mod.promise, meta, metadata)
    }

    let debugTimer: any
    if (this.debug) {
      debugTimer = setTimeout(() => {
        const getStack = () =>
          `stack:\n${[...callstack, moduleId]
            .reverse()
            .map((p) => `  - ${p}`)
            .join('\n')}`

        this.debug!(
          `[module runner] module ${moduleId} takes over 2s to load.\n${getStack()}`,
        )
      }, 2000)
    }

    try {
      const promise = this.directRequest(url, mod, callstack)
      mod.promise = promise
      mod.evaluated = false
      return this.processImport(await promise, meta, metadata)
    } finally {
      mod.evaluated = true
      if (debugTimer) clearTimeout(debugTimer)
    }
  }

  private async cachedModule(
    url: string,
    importer?: string,
    graph = this.moduleGraph,
  ): Promise<EvaluatedModuleNode> {
    let cached = graph.requests.get(url)
    if (!cached) {
      const cachedModule = graph.modules.getModuleByUrl(url)
      cached = this.getModuleInformation(
        url,
        importer,
        cachedModule,
        graph,
      ).finally(() => {
        graph.requests.delete(url)
      })
      graph.requests.set(url, cached)
    } else {
      this.debug?.('[module runner] using cached module info for', url)
    }

    const mod = await cached
    this.moduleGraphs.set(mod, graph)
    return mod
  }

  private ensureBuiltins(): Promise<void> | undefined {
    if (this.isBuiltin) return

    this.builtinsPromise ??= (async () => {
      try {
        this.debug?.('[module runner] fetching builtins from server')
        const serializedBuiltins = await this.transport.invoke(
          'getBuiltins',
          [],
        )
        const builtins = serializedBuiltins.map((builtin) =>
          typeof builtin === 'object' && builtin && 'type' in builtin
            ? builtin.type === 'string'
              ? builtin.value
              : new RegExp(builtin.source, builtin.flags)
            : // NOTE: Vitest returns raw values instead of serialized ones
              builtin,
        )
        this.isBuiltin = createIsBuiltin(builtins)
        this.debug?.('[module runner] builtins loaded:', builtins)
      } finally {
        this.builtinsPromise = undefined
      }
    })()

    return this.builtinsPromise
  }

  private async getModuleInformation(
    url: string,
    importer: string | undefined,
    cachedModule: EvaluatedModuleNode | undefined,
    graph: ModuleGraph,
  ): Promise<EvaluatedModuleNode> {
    if (this.closed) {
      throw new Error(`Vite module runner has been closed.`)
    }

    if (graph.detached && cachedModule?.meta) {
      return cachedModule
    }

    await this.ensureBuiltins()

    this.debug?.('[module runner] fetching', url)

    const isCached = !!(typeof cachedModule === 'object' && cachedModule.meta)

    const fetchedModule = // fast return for established externalized pattern
      (
        url.startsWith('data:') || this.isBuiltin?.(url)
          ? { externalize: url, type: 'builtin' }
          : await this.transport.invoke('fetchModule', [
              url,
              importer,
              {
                cached: isCached,
                startOffset: this.evaluator.startOffset,
              },
            ])
      ) as ResolvedResult

    if ('cache' in fetchedModule) {
      if (!cachedModule || !cachedModule.meta) {
        throw new Error(
          `Module "${url}" was mistakenly invalidated during fetch phase.`,
        )
      }
      return cachedModule
    }

    const moduleId =
      'externalize' in fetchedModule
        ? fetchedModule.externalize
        : fetchedModule.id
    const moduleUrl = 'url' in fetchedModule ? fetchedModule.url : url
    const module = graph.modules.ensureModule(moduleId, moduleUrl)

    // Another URL may resolve to an already evaluated module in a retired
    // graph. Its exports must remain the same even if the server changed it.
    if (graph.detached && module.meta) {
      return module
    }

    if ('invalidate' in fetchedModule && fetchedModule.invalidate) {
      graph.modules.invalidateModule(module)
      graph.hotContexts.delete(module.url)
    }

    fetchedModule.url = moduleUrl
    fetchedModule.id = moduleId
    module.meta = fetchedModule

    // Do not keep lazy "patches" in memory, but keep the sourcemap
    if (module.url.startsWith('/@vite/lazy?')) {
      graph.modules.removeModule(module, { retainSourceMap: true })
    }

    return module
  }

  // override is allowed, consider this a public API
  protected async directRequest(
    url: string,
    mod: EvaluatedModuleNode,
    _callstack: string[],
  ): Promise<any> {
    const fetchResult = mod.meta!
    const moduleId = fetchResult.id
    const callstack = [..._callstack, moduleId]
    const graph = this.moduleGraphs.get(mod) ?? this.moduleGraph

    const request = async (dep: string, metadata?: SSRImportMetadata) => {
      const importer = ('file' in fetchResult && fetchResult.file) || moduleId
      const depMod = await this.cachedModule(dep, importer, graph)
      mod.imports.add(depMod.id)

      return this.cachedRequest(dep, depMod, callstack, metadata)
    }

    const dynamicRequest = async (dep: string) => {
      // it's possible to provide an object with toString() method inside import()
      dep = String(dep)
      if (dep[0] === '.') {
        dep = posixJoin(posixDirname(url), dep)
      }
      return request(dep, { isDynamicImport: true })
    }

    if ('externalize' in fetchResult) {
      const { externalize } = fetchResult
      this.debug?.('[module runner] externalizing', externalize)
      const exports = await this.evaluator.runExternalModule(externalize)
      mod.exports = exports
      this.rolldownDevRuntime?.registerModule(externalize, { exports })
      return exports
    }

    const { code, file } = fetchResult

    if (code == null) {
      const importer = callstack[callstack.length - 2]
      throw new Error(
        `[module runner] Failed to load "${url}"${
          importer ? ` imported from ${importer}` : ''
        }`,
      )
    }

    const createImportMeta =
      this.options.createImportMeta ?? createDefaultImportMeta

    const modulePath = cleanUrl(file || moduleId)
    // disambiguate the `<UNIT>:/` on windows: see nodejs/node#31710
    const meta = await createImportMeta(modulePath)
    const exports = Object.create(null)
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module',
      enumerable: false,
      configurable: false,
    })

    mod.exports = exports

    if (this.hmrClient) {
      Object.defineProperty(meta, 'hot', {
        enumerable: true,
        get: () => {
          return this.ensureModuleHotContext(mod.url, graph)
        },
        set: (value) => {
          graph.hotContexts.set(mod.url, value)
        },
      })
    }

    const context: ModuleRunnerContext = {
      [ssrImportKey]: request,
      [ssrDynamicImportKey]: dynamicRequest,
      [ssrModuleExportsKey]: exports,
      [ssrExportAllKey]: (obj: any) => exportAll(exports, obj),
      [ssrExportNameKey]: (name, getter) =>
        Object.defineProperty(exports, name, {
          enumerable: true,
          configurable: true,
          get: getter,
        }),
      [ssrImportMetaKey]: meta,
      [ssrRolldownRuntimeKey]: this.rolldownDevRuntime,
    }

    this.debug?.('[module runner] executing', meta.href)

    await this.evaluator.runInlinedModule(context, code, mod)

    return exports
  }

  private createRolldownDevRuntime(): DevRuntime {
    class ViteDevRuntime extends DevRuntime {
      constructor(private readonly runner: ModuleRunner) {
        super(nanoid())
      }

      payloadDelivered(filename: string): void {
        this.runner.transport.send({
          type: 'custom',
          event: 'vite:bundled-dev:payload-delivered',
          data: { filename },
        })
      }

      // Rolldown's runtime uses `import` that will not be rewritten by the module runner transform
      override loadLazyChunk(proxyModuleId: string): Promise<unknown> {
        return this.runner.import(
          `/@vite/lazy?id=${encodeURIComponent(proxyModuleId)}&clientId=${this.clientId}`,
        )
      }

      override hooks: DevRuntime['hooks'] = {
        createModuleHotContext: (id) => this.runner.ensureModuleHotContext(id),
        onModuleCacheRemoval: (id) =>
          this.runner._bundledDevHmrClient?.handleModuleCacheRemoval(id),
      }
    }
    return new ViteDevRuntime(this)
  }

  private ensureModuleHotContext(url: string, graph = this.moduleGraph) {
    if (!this.hmrClient) {
      return
    }

    if (!graph.hotContexts.has(url)) {
      this.debug?.('[module runner] creating hmr context for', url)
      // in full-bundle mode `invalidate()` is resolved locally against the
      // rolldown runtime graph instead of being sent to the server
      const hotContext = this._bundledDevHmrClient
        ? new BundledDevHMRContext(this._bundledDevHmrClient, url)
        : new HMRContext(this.hmrClient, url, () => !graph.detached)
      graph.hotContexts.set(url, hotContext)
    }
    return graph.hotContexts.get(url)
  }
}

function exportAll(exports: any, sourceModule: any) {
  // when a module exports itself it causes
  // call stack error
  if (exports === sourceModule) return

  if (
    isPrimitive(sourceModule) ||
    Array.isArray(sourceModule) ||
    sourceModule instanceof Promise
  )
    return

  for (const key in sourceModule) {
    if (key !== 'default' && key !== '__esModule' && !(key in exports)) {
      try {
        Object.defineProperty(exports, key, {
          enumerable: true,
          configurable: true,
          get: () => sourceModule[key],
        })
      } catch {}
    }
  }
}
