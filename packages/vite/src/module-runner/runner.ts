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
import { cleanUrl, isPrimitive, promiseWithResolvers } from '../shared/utils'
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
import type { CycleGroup, EvaluatedModuleNode } from './evaluatedModules'
import { EvaluatedModules, findCycleGroup } from './evaluatedModules'
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
  private readonly concurrentModuleNodePromises = new Map<
    string,
    Promise<EvaluatedModuleNode>
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
    this.evaluatedModules.clear()
    this.hmrClient?.clear()
  }

  /** @internal */
  public async _resetBundledDevRuntime(): Promise<void> {
    this.evaluatedModules.clear()
    this.moduleHotContexts.clear()

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

  /**
   * A module is finished once it has run and so has the rest of its cycle
   * group: an importer may still be waiting for that group.
   */
  private isFinished(mod: EvaluatedModuleNode): boolean {
    return (
      mod.evaluated && (!mod.cycleGroup || findCycleGroup(mod.cycleGroup).done)
    )
  }

  /**
   * Path of module ids from one of the imports of `mod` down to an entry of
   * `callstack`, through modules that haven't finished. The path is returned
   * in reverse order.
   */
  private findCyclePath(
    mod: EvaluatedModuleNode,
    callstack: string[],
    visited = new Set<string>(),
  ): string[] | undefined {
    if (visited.has(mod.id)) return
    visited.add(mod.id)

    for (const importedModuleId of mod.imports) {
      const importedModule =
        this.evaluatedModules.getModuleById(importedModuleId)
      if (!importedModule?.promise || this.isFinished(importedModule)) {
        continue
      }
      if (callstack.includes(importedModuleId)) {
        return [importedModuleId]
      }
      const path = this.findCyclePath(importedModule, callstack, visited)
      if (path) {
        path.push(importedModuleId)
        return path
      }
    }
  }

  /**
   * Returns the modules on a cycle through `mod` and `callstack`, or
   * `undefined` if requesting `mod` from `callstack` is not circular.
   */
  private findCycle(
    mod: EvaluatedModuleNode,
    callstack: string[],
  ): string[] | undefined {
    if (this.isFinished(mod)) return

    const group = mod.cycleGroup && findCycleGroup(mod.cycleGroup)
    if (group && !group.done) {
      for (let i = 0; i < callstack.length; i++) {
        const node = this.evaluatedModules.getModuleById(callstack[i])
        if (node?.cycleGroup && findCycleGroup(node.cycleGroup) === group) {
          return [...callstack.slice(i), mod.id]
        }
      }
    }

    const index = callstack.indexOf(mod.id)
    if (index !== -1) return callstack.slice(index)

    const path = this.findCyclePath(mod, callstack)
    if (path) {
      return [...callstack.slice(callstack.indexOf(path[0])), mod.id, ...path]
    }
  }

  /**
   * Puts the unfinished modules of a cycle into one group.
   */
  private joinCycleGroup(ids: string[]): void {
    let root: CycleGroup | undefined
    let merged = false
    for (const id of ids) {
      const node = this.evaluatedModules.getModuleById(id)
      if (!node || this.isFinished(node)) continue

      let group = node.cycleGroup && findCycleGroup(node.cycleGroup)
      if (!group) {
        group = node.cycleGroup = {
          parent: undefined,
          pending: node.runs,
          done: false,
          error: undefined,
          signal: promiseWithResolvers(),
        }
      }
      if (!root) {
        root = group
        continue
      }
      if (group === root) continue

      group.parent = root
      root.pending += group.pending
      if (group.error && !root.error) root.error = group.error
      // wake up the importers waiting on the merged group, they will wait on
      // the new root instead
      group.signal.resolve()
      merged = true
    }
    if (root && merged) {
      // importers waiting on the root check again whether they are now part
      // of the cycle
      const signal = root.signal
      root.signal = promiseWithResolvers()
      signal.resolve()
    }
  }

  private finishRun(mod: EvaluatedModuleNode, error?: unknown): void {
    mod.runs--
    if (!mod.cycleGroup) return
    const group = findCycleGroup(mod.cycleGroup)
    if (group.done) return
    if (error) {
      // like in Node.js, an error in a cycle fails the whole cycle
      group.error = error
    } else if (--group.pending > 0) {
      return
    }
    group.done = true
    group.signal.resolve()
  }

  /**
   * Waits for the rest of the cycle group of `mod`. If the group is waiting on
   * our own `callstack`, we are part of the cycle instead: the group can only
   * finish after we return, so we join it.
   */
  private async waitForCycleGroup(
    mod: EvaluatedModuleNode,
    callstack: string[],
  ): Promise<void> {
    while (mod.cycleGroup) {
      const group = findCycleGroup(mod.cycleGroup)
      if (group.done) {
        if (group.error) throw group.error
        return
      }
      // checked again after every merge, as it can bring our callstack in
      const cycle = this.findCycle(mod, callstack)
      if (cycle) {
        this.joinCycleGroup(cycle)
        return
      }
      await group.signal.promise
    }
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

    // fast path: finished modules can't deadlock
    if (mod.promise && this.isFinished(mod)) {
      const exports = await mod.promise
      // like in Node.js, an error in a cycle is thrown for each of its modules
      const error = mod.cycleGroup && findCycleGroup(mod.cycleGroup).error
      if (error) throw error
      return this.processImport(exports, meta, metadata)
    }

    if (mod.promise) {
      if (mod.exports) {
        const cycle = this.findCycle(mod, callstack)
        if (cycle) {
          // a dynamic import doesn't make its importer wait for the module,
          // so it doesn't tie their evaluations together
          if (!metadata?.isDynamicImport) this.joinCycleGroup(cycle)
          return this.processImport(mod.exports, meta, metadata)
        }
      }
      const exports = await mod.promise
      await this.waitForCycleGroup(mod, callstack)
      return this.processImport(exports, meta, metadata)
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
      mod.runs++
      if (mod.cycleGroup) {
        const group = findCycleGroup(mod.cycleGroup)
        if (group.done) mod.cycleGroup = undefined
        else group.pending++
      }
      const promise = this.directRequest(url, mod, callstack)
      mod.promise = promise
      mod.evaluated = false
      let exports: any
      try {
        exports = await promise
      } catch (error) {
        mod.evaluated = true
        this.finishRun(mod, error)
        throw error
      }
      mod.evaluated = true
      this.finishRun(mod)
      await this.waitForCycleGroup(mod, callstack)
      return this.processImport(exports, meta, metadata)
    } finally {
      mod.evaluated = true
      if (debugTimer) clearTimeout(debugTimer)
    }
  }

  private async cachedModule(
    url: string,
    importer?: string,
  ): Promise<EvaluatedModuleNode> {
    let cached = this.concurrentModuleNodePromises.get(url)
    if (!cached) {
      const cachedModule = this.evaluatedModules.getModuleByUrl(url)
      cached = this.getModuleInformation(url, importer, cachedModule).finally(
        () => {
          this.concurrentModuleNodePromises.delete(url)
        },
      )
      this.concurrentModuleNodePromises.set(url, cached)
    } else {
      this.debug?.('[module runner] using cached module info for', url)
    }

    return cached
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
  ): Promise<EvaluatedModuleNode> {
    if (this.closed) {
      throw new Error(`Vite module runner has been closed.`)
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
    const module = this.evaluatedModules.ensureModule(moduleId, moduleUrl)

    if ('invalidate' in fetchedModule && fetchedModule.invalidate) {
      this.evaluatedModules.invalidateModule(module)
      this.moduleHotContexts.delete(module.url)
    }

    fetchedModule.url = moduleUrl
    fetchedModule.id = moduleId
    module.meta = fetchedModule

    // Do not keep lazy "patches" in memory, but keep the sourcemap
    if (module.url.startsWith('/@vite/lazy?')) {
      this.evaluatedModules.removeModule(module, { retainSourceMap: true })
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

    const request = async (dep: string, metadata?: SSRImportMetadata) => {
      const importer = ('file' in fetchResult && fetchResult.file) || moduleId
      const depMod = await this.cachedModule(dep, importer)
      depMod.importers.add(moduleId)
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
          return this.ensureModuleHotContext(mod.url)
        },
        set: (value) => {
          this.moduleHotContexts.set(mod.url, value)
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

  private moduleHotContexts = new Map<string, HMRContext>()

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

  private ensureModuleHotContext(url: string) {
    if (!this.hmrClient) {
      return
    }

    if (!this.moduleHotContexts.has(url)) {
      this.debug?.('[module runner] creating hmr context for', url)
      // in full-bundle mode `invalidate()` is resolved locally against the
      // rolldown runtime graph instead of being sent to the server
      const hotContext = this._bundledDevHmrClient
        ? new BundledDevHMRContext(this._bundledDevHmrClient, url)
        : new HMRContext(this.hmrClient, url)
      this.moduleHotContexts.set(url, hotContext)
    }
    return this.moduleHotContexts.get(url)
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
