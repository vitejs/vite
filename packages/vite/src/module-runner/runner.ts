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
  // Keyed by the requested ModuleRunnerURL or entry-point input.
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
      // HMR paths are ModuleURLs.
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
   * Execute a ModuleRunnerURL: a base-free URL with virtual IDs wrapped in `/@id/`.
   * Entry points also accept file paths, file URLs, ModuleURLs, and unresolved IDs.
   */
  public async import<T = any>(moduleRunnerUrl: string): Promise<T> {
    const fetchedModule = await this.cachedModule(moduleRunnerUrl)
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
    const { url: externalSpecifier, type } = fetchResult
    if (type !== 'module' && type !== 'commonjs') return exports
    analyzeImportedModDifference(exports, externalSpecifier, type, metadata)
    return exports
  }

  private isCircularRequest(
    mod: EvaluatedModuleNode,
    callstack: string[],
    visited = new Set<string>(),
  ): boolean {
    if (visited.has(mod.id)) {
      return false
    }
    visited.add(mod.id)

    for (const importedModuleId of mod.imports) {
      const importedModule =
        this.evaluatedModules.getModuleById(importedModuleId)
      if (!importedModule?.promise || importedModule.evaluated) {
        continue
      }

      if (callstack.includes(importedModuleId)) {
        return true
      }

      if (this.isCircularRequest(importedModule, callstack, visited)) {
        return true
      }
    }

    return false
  }

  private async cachedRequest(
    moduleRunnerUrl: string,
    mod: EvaluatedModuleNode,
    callstack: string[] = [],
    metadata?: SSRImportMetadata,
  ): Promise<any> {
    const meta = mod.meta!
    const moduleId = meta.id

    const importerId = callstack.at(-1)

    if (importerId) mod.importers.add(importerId)

    // fast path: already evaluated modules can't deadlock
    if (mod.evaluated && mod.promise) {
      return this.processImport(await mod.promise, meta, metadata)
    }

    if (mod.promise) {
      if (
        mod.exports &&
        (callstack.includes(moduleId) || this.isCircularRequest(mod, callstack))
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
      const promise = this.directRequest(moduleRunnerUrl, mod, callstack)
      mod.promise = promise
      mod.evaluated = false
      return this.processImport(await promise, meta, metadata)
    } finally {
      mod.evaluated = true
      if (debugTimer) clearTimeout(debugTimer)
    }
  }

  private async cachedModule(
    moduleRunnerUrl: string,
    importerId?: string,
  ): Promise<EvaluatedModuleNode> {
    let cached = this.concurrentModuleNodePromises.get(moduleRunnerUrl)
    if (!cached) {
      const cachedModule = this.evaluatedModules.getModuleByUrl(moduleRunnerUrl)
      cached = this.getModuleInformation(
        moduleRunnerUrl,
        importerId,
        cachedModule,
      ).finally(() => {
        this.concurrentModuleNodePromises.delete(moduleRunnerUrl)
      })
      this.concurrentModuleNodePromises.set(moduleRunnerUrl, cached)
    } else {
      this.debug?.(
        '[module runner] using cached module info for',
        moduleRunnerUrl,
      )
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
    moduleRunnerUrl: string,
    importerId: string | undefined,
    cachedModule: EvaluatedModuleNode | undefined,
  ): Promise<EvaluatedModuleNode> {
    if (this.closed) {
      throw new Error(`Vite module runner has been closed.`)
    }

    await this.ensureBuiltins()

    this.debug?.('[module runner] fetching', moduleRunnerUrl)

    const isCached = !!(typeof cachedModule === 'object' && cachedModule.meta)

    const fetchedModule = // fast return for established externalized pattern
      (
        moduleRunnerUrl.startsWith('data:') || this.isBuiltin?.(moduleRunnerUrl)
          ? { externalize: moduleRunnerUrl, type: 'builtin' }
          : await this.transport.invoke('fetchModule', [
              moduleRunnerUrl,
              importerId,
              {
                cached: isCached,
                startOffset: this.evaluator.startOffset,
              },
            ])
      ) as ResolvedResult

    if ('cache' in fetchedModule) {
      if (!cachedModule || !cachedModule.meta) {
        throw new Error(
          `Module "${moduleRunnerUrl}" was mistakenly invalidated during fetch phase.`,
        )
      }
      return cachedModule
    }

    // External import targets serve as their ModuleIDs.
    const moduleId =
      'externalize' in fetchedModule
        ? fetchedModule.externalize
        : fetchedModule.id
    // Internal fetches return the server ModuleURL; external fetches keep the requested specifier.
    const moduleUrl =
      'url' in fetchedModule ? fetchedModule.url : moduleRunnerUrl
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
    moduleRunnerUrl: string,
    mod: EvaluatedModuleNode,
    _callstack: string[],
  ): Promise<any> {
    const fetchResult = mod.meta!
    const moduleId = fetchResult.id
    const callstack = [..._callstack, moduleId]

    const request = async (
      depModuleRunnerUrl: string,
      metadata?: SSRImportMetadata,
    ) => {
      const importerId = ('file' in fetchResult && fetchResult.file) || moduleId
      const depMod = await this.cachedModule(depModuleRunnerUrl, importerId)
      depMod.importers.add(moduleId)
      mod.imports.add(depMod.id)

      return this.cachedRequest(depModuleRunnerUrl, depMod, callstack, metadata)
    }

    const dynamicRequest = async (specifier: string) => {
      // it's possible to provide an object with toString() method inside import()
      let depModuleRunnerUrl = String(specifier)
      if (depModuleRunnerUrl[0] === '.') {
        depModuleRunnerUrl = posixJoin(
          posixDirname(moduleRunnerUrl),
          depModuleRunnerUrl,
        )
      }
      return request(depModuleRunnerUrl, { isDynamicImport: true })
    }

    if ('externalize' in fetchResult) {
      const { externalize: externalSpecifier } = fetchResult
      this.debug?.('[module runner] externalizing', externalSpecifier)
      const exports = await this.evaluator.runExternalModule(externalSpecifier)
      mod.exports = exports
      this.rolldownDevRuntime?.registerModule(externalSpecifier, { exports })
      return exports
    }

    const { code, file } = fetchResult

    if (code == null) {
      const importerId = callstack[callstack.length - 2]
      throw new Error(
        `[module runner] Failed to load "${moduleRunnerUrl}"${
          importerId ? ` imported from ${importerId}` : ''
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

  // Keyed by ModuleURL for unbundled modules and chunks, or by Rolldown module ID.
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
      override loadLazyChunk(proxyRolldownModuleId: string): Promise<unknown> {
        return this.runner.import(
          `/@vite/lazy?id=${encodeURIComponent(proxyRolldownModuleId)}&clientId=${this.clientId}`,
        )
      }

      override hooks: DevRuntime['hooks'] = {
        createModuleHotContext: (rolldownModuleId) =>
          this.runner.ensureModuleHotContext(rolldownModuleId),
        onModuleCacheRemoval: (rolldownModuleId) =>
          this.runner._bundledDevHmrClient?.handleModuleCacheRemoval(
            rolldownModuleId,
          ),
      }
    }
    return new ViteDevRuntime(this)
  }

  private ensureModuleHotContext(
    /** ModuleURL for unbundled modules and chunks, or a Rolldown module ID. */
    hotContextId: string,
  ) {
    if (!this.hmrClient) {
      return
    }

    if (!this.moduleHotContexts.has(hotContextId)) {
      this.debug?.('[module runner] creating hmr context for', hotContextId)
      // in full-bundle mode `invalidate()` is resolved locally against the
      // rolldown runtime graph instead of being sent to the server
      const hotContext = this._bundledDevHmrClient
        ? new BundledDevHMRContext(this._bundledDevHmrClient, hotContextId)
        : new HMRContext(this.hmrClient, hotContextId)
      this.moduleHotContexts.set(hotContextId, hotContext)
    }
    return this.moduleHotContexts.get(hotContextId)
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
