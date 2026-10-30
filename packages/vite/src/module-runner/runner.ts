import type { ViteHotContext } from '#types/hot'
import { createIsBuiltin } from '../shared/builtin'
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
import { posixDirname, posixPathToFileHref, posixResolve } from './utils'

interface ModuleRunnerDebugger {
  (formatter: unknown, ...args: unknown[]): void
}

const prefetchLimit = 16

// matches the calls `ssrTransform` writes for static imports:
// `await __vite_ssr_import__("/src/foo.ts", ...)`
const ssrImportRE = new RegExp(`${ssrImportKey}\\(("(?:[^"\\\\]|\\\\.)*")`, 'g')

export class ModuleRunner {
  public evaluatedModules: EvaluatedModules
  public hmrClient?: HMRClient

  // Counts the events after which a module the runner holds may be out of
  // date: HMR messages, `clearCache()`, and the server sending new code for
  // a module the runner held.
  /** @internal */
  public hmrGeneration = 0

  private readonly transport: NormalizedModuleRunnerTransport
  private readonly resetSourceMapSupport?: () => void
  private readonly concurrentModuleNodePromises = new Map<
    string,
    Promise<EvaluatedModuleNode>
  >()
  private isBuiltin?: (id: string) => boolean
  private builtinsPromise?: Promise<void>
  // the generation in which each request was sent
  private readonly requestGeneration = new WeakMap<
    Promise<EvaluatedModuleNode>,
    number
  >()
  // the generation in which the server last sent or confirmed each module
  private readonly checkedIn = new WeakMap<EvaluatedModuleNode, number>()
  private readonly prefetchQueue: [
    url: string,
    importerFile: string,
    importerId: string,
  ][] = []
  private activePrefetches = 0

  private closed = false

  constructor(
    public options: ModuleRunnerOptions,
    public evaluator: ModuleEvaluator = new ESModulesEvaluator(),
    private debug?: ModuleRunnerDebugger | undefined,
  ) {
    this.evaluatedModules = options.evaluatedModules ?? new EvaluatedModules()
    this.transport = normalizeModuleRunnerTransport(options.transport)
    if (options.hmr !== false) {
      const optionsHmr = options.hmr ?? true
      const resolvedHmrLogger: HMRLogger =
        optionsHmr === true || optionsHmr.logger === undefined
          ? hmrLogger
          : optionsHmr.logger === false
            ? silentConsole
            : optionsHmr.logger
      this.hmrClient = new HMRClient(
        resolvedHmrLogger,
        this.transport,
        ({ acceptedPath }) => this.import(acceptedPath),
      )
      if (!this.transport.connect) {
        throw new Error(
          'HMR is not supported by this runner transport, but `hmr` option was set to true',
        )
      }
      this.transport.connect(createHMRHandlerForRunner(this))
    } else {
      this.transport.connect?.()
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
    return await this.cachedRequest(url, fetchedModule)
  }

  /**
   * Clear all caches including HMR listeners.
   */
  public clearCache(): void {
    this.evaluatedModules.clear()
    this.hmrClient?.clear()
    this.prefetchQueue.length = 0
    this.hmrGeneration++
  }

  /**
   * Clears all caches, removes all HMR listeners, and resets source map support.
   * This method doesn't stop the HMR connection.
   */
  public async close(): Promise<void> {
    this.resetSourceMapSupport?.()
    this.clearCache()
    this.hmrClient = undefined
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
  ): Promise<EvaluatedModuleNode> {
    const pending = this.concurrentModuleNodePromises.get(url)
    if (
      pending &&
      this.hmrClient &&
      this.requestGeneration.get(pending) !== this.hmrGeneration
    ) {
      // sent before a newer message from the server, so its answer may be
      // out of date: let it settle, keeping one request per URL, then ask
      // again
      await pending.catch(() => {})
    }
    let cached = this.concurrentModuleNodePromises.get(url)
    if (!cached) {
      const cachedModule = this.evaluatedModules.getModuleByUrl(url)
      const generation = this.hmrGeneration
      cached = this.getModuleInformation(
        url,
        importer,
        cachedModule,
        generation,
      ).finally(() => {
        this.concurrentModuleNodePromises.delete(url)
      })
      this.requestGeneration.set(cached, generation)
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
    // taken before the request is sent: an answer that arrives after a
    // newer message from the server may predate it
    generation: number,
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
      this.checkedIn.set(cachedModule, generation)
      return cachedModule
    }

    const moduleId =
      'externalize' in fetchedModule
        ? fetchedModule.externalize
        : fetchedModule.id
    const moduleUrl = 'url' in fetchedModule ? fetchedModule.url : url
    const module = this.evaluatedModules.ensureModule(moduleId, moduleUrl)

    if ('invalidate' in fetchedModule && fetchedModule.invalidate) {
      // The server changed a module the runner holds without an HMR
      // message, as when a plugin invalidates it. Others may have changed
      // with it, so stop trusting what was checked before.
      if (module.meta) this.hmrGeneration++
      this.evaluatedModules.invalidateModule(module)
    }

    fetchedModule.url = moduleUrl
    fetchedModule.id = moduleId
    module.meta = fetchedModule
    this.checkedIn.set(module, generation)

    if ('code' in fetchedModule) this.prefetchImports(fetchedModule)

    return module
  }

  // The module for `url` if the server sent or confirmed it in the current
  // generation, so it can be used without asking again. Only with HMR on:
  // without it, nothing would tell the runner that a module changed. Only
  // URLs that start with `/`: the server resolves a bare specifier against
  // its importer, so the same URL can name different modules.
  private currentModule(url: string): EvaluatedModuleNode | undefined {
    if (!this.hmrClient || url[0] !== '/') return
    const mod = this.evaluatedModules.getModuleByUrl(url)
    if (mod?.meta && this.checkedIn.get(mod) === this.hmrGeneration) {
      return mod
    }
  }

  // Fetches the static imports of a module the server just sent, at most
  // `prefetchLimit` at a time. Evaluation reaches each import in turn, so
  // without this every module costs a full round trip, one after another.
  // The import that needs a module joins its prefetch through
  // `concurrentModuleNodePromises`, as it would join any other request.
  private prefetchImports(result: ResolvedResult): void {
    if (!this.hmrClient || !('code' in result)) return
    if (typeof result.code !== 'string') return
    const importerFile = result.file || result.id
    for (const match of result.code.matchAll(ssrImportRE)) {
      let url: string
      try {
        url = JSON.parse(match[1]!)
      } catch {
        continue
      }
      // the same rule as `currentModule`
      if (url[0] === '/')
        this.prefetchQueue.push([url, importerFile, result.id])
    }
    this.pumpPrefetches()
  }

  private pumpPrefetches(): void {
    if (this.closed) {
      this.prefetchQueue.length = 0
      return
    }
    while (this.activePrefetches < prefetchLimit && this.prefetchQueue.length) {
      const [url, importerFile, importerId] = this.prefetchQueue.shift()!
      if (
        this.concurrentModuleNodePromises.has(url) ||
        this.currentModule(url)
      ) {
        continue
      }
      this.debug?.('[module runner] prefetching', url)
      this.activePrefetches++
      this.cachedModule(url, importerFile)
        .then(
          // so that a full reload walks up to the real entrypoint even if
          // the importer never reaches this import
          (mod) => mod.importers.add(importerId),
          // the import that needs this module fetches it again and reports
          // the error
          () => {},
        )
        .finally(() => {
          this.activePrefetches--
          this.pumpPrefetches()
        })
    }
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
      const depMod =
        this.currentModule(dep) ?? (await this.cachedModule(dep, importer))
      depMod.importers.add(moduleId)
      mod.imports.add(depMod.id)

      return this.cachedRequest(dep, depMod, callstack, metadata)
    }

    const dynamicRequest = async (dep: string) => {
      // it's possible to provide an object with toString() method inside import()
      dep = String(dep)
      if (dep[0] === '.') {
        dep = posixResolve(posixDirname(url), dep)
      }
      return request(dep, { isDynamicImport: true })
    }

    if ('externalize' in fetchResult) {
      const { externalize } = fetchResult
      this.debug?.('[module runner] externalizing', externalize)
      const exports = await this.evaluator.runExternalModule(externalize)
      mod.exports = exports
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
    const href = posixPathToFileHref(modulePath)
    const meta = await createImportMeta(modulePath)
    const exports = Object.create(null)
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module',
      enumerable: false,
      configurable: false,
    })

    mod.exports = exports

    let hotContext: ViteHotContext | undefined
    if (this.hmrClient) {
      Object.defineProperty(meta, 'hot', {
        enumerable: true,
        get: () => {
          if (!this.hmrClient) {
            throw new Error(`[module runner] HMR client was closed.`)
          }
          this.debug?.('[module runner] creating hmr context for', mod.url)
          hotContext ||= new HMRContext(this.hmrClient, mod.url)
          return hotContext
        },
        set: (value) => {
          hotContext = value
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
    }

    this.debug?.('[module runner] executing', href)

    await this.evaluator.runInlinedModule(context, code, mod)

    return exports
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
