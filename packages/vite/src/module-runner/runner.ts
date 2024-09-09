import type { ViteHotContext } from 'types/hot'
import { HMRClient, HMRContext } from '../shared/hmr'
import { cleanUrl, isPrimitive, isWindows, unwrapId } from '../shared/utils'
import { analyzeImportedModDifference } from '../shared/ssrTransform'
import { ModuleCacheMap } from './moduleCache'
import type {
  ModuleCache,
  ModuleEvaluator,
  ModuleRunnerContext,
  ModuleRunnerImportMeta,
  ModuleRunnerOptions,
  ResolvedResult,
  SSRImportMetadata,
} from './types'
import {
  normalizeAbsoluteUrl,
  posixDirname,
  posixPathToFileHref,
  posixResolve,
  toWindowsPath,
} from './utils'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import { hmrLogger, silentConsole } from './hmrLogger'
import { createHMRHandler } from './hmrHandler'
import { enableSourceMapSupport } from './sourcemap/index'
import type { RunnerTransport } from './runnerTransport'

interface ModuleRunnerDebugger {
  (formatter: unknown, ...args: unknown[]): void
}

export class ModuleRunner {
  /**
   * Holds the cache of modules
   * Keys of the map are ids
   */
  public moduleCache: ModuleCacheMap
  public hmrClient?: HMRClient

  private readonly urlToIdMap = new Map<string, string>()
  private readonly fileToIdMap = new Map<string, string[]>()
  private readonly envProxy = new Proxy({} as any, {
    get(_, p) {
      throw new Error(
        `[module runner] Dynamic access of "import.meta.env" is not supported. Please, use "import.meta.env.${String(p)}" instead.`,
      )
    },
  })
  private readonly transport: RunnerTransport
  private readonly resetSourceMapSupport?: () => void
  private readonly root: string
  private readonly moduleInfoCache = new Map<string, Promise<ModuleCache>>()

  private destroyed = false

  constructor(
    public options: ModuleRunnerOptions,
    public evaluator: ModuleEvaluator,
    private debug?: ModuleRunnerDebugger,
  ) {
    const root = this.options.root
    this.root = root[root.length - 1] === '/' ? root : `${root}/`
    this.moduleCache = options.moduleCache ?? new ModuleCacheMap(options.root)
    this.transport = options.transport
    if (typeof options.hmr === 'object') {
      this.hmrClient = new HMRClient(
        options.hmr.logger === false
          ? silentConsole
          : options.hmr.logger || hmrLogger,
        options.hmr.connection,
        ({ acceptedPath }) => this.import(acceptedPath),
      )
      options.hmr.connection.onUpdate(createHMRHandler(this))
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
    this.moduleCache.clear()
    this.urlToIdMap.clear()
    this.hmrClient?.clear()
  }

  /**
   * Clears all caches, removes all HMR listeners, and resets source map support.
   * This method doesn't stop the HMR connection.
   */
  public async destroy(): Promise<void> {
    this.resetSourceMapSupport?.()
    this.clearCache()
    this.hmrClient = undefined
    this.destroyed = true
  }

  /**
   * Returns `true` if the runtime has been destroyed by calling `destroy()` method.
   */
  public isDestroyed(): boolean {
    return this.destroyed
  }

  private processImport(
    exports: Record<string, any>,
    fetchResult: ResolvedResult,
    metadata?: SSRImportMetadata,
  ) {
    if (!('externalize' in fetchResult)) {
      return exports
    }
    const { url: id, type } = fetchResult
    if (type !== 'module' && type !== 'commonjs') return exports
    analyzeImportedModDifference(exports, id, type, metadata)
    return exports
  }

  private isCircularModule(mod: Required<ModuleCache>) {
    for (const importedFile of mod.imports) {
      if (mod.importers.has(importedFile)) {
        return true
      }
    }
    return false
  }

  private isCircularImport(
    importers: Set<string>,
    moduleUrl: string,
    visited = new Set<string>(),
  ) {
    for (const importer of importers) {
      if (visited.has(importer)) {
        continue
      }
      visited.add(importer)
      if (importer === moduleUrl) {
        return true
      }
      const mod = this.moduleCache.getByModuleId(
        importer,
      ) as Required<ModuleCache>
      if (
        mod.importers.size &&
        this.isCircularImport(mod.importers, moduleUrl, visited)
      ) {
        return true
      }
    }
    return false
  }

  private async cachedRequest(
    id: string,
    mod_: ModuleCache,
    callstack: string[] = [],
    metadata?: SSRImportMetadata,
  ): Promise<any> {
    const mod = mod_ as Required<ModuleCache>
    const meta = mod.meta!
    const moduleUrl = meta.url

    const { importers } = mod

    const importee = callstack[callstack.length - 1]

    if (importee) importers.add(importee)

    // check circular dependency
    if (
      callstack.includes(moduleUrl) ||
      this.isCircularModule(mod) ||
      this.isCircularImport(importers, moduleUrl)
    ) {
      if (mod.exports) return this.processImport(mod.exports, meta, metadata)
    }

    let debugTimer: any
    if (this.debug) {
      debugTimer = setTimeout(() => {
        const getStack = () =>
          `stack:\n${[...callstack, moduleUrl]
            .reverse()
            .map((p) => `  - ${p}`)
            .join('\n')}`

        this.debug!(
          `[module runner] module ${moduleUrl} takes over 2s to load.\n${getStack()}`,
        )
      }, 2000)
    }

    try {
      // cached module
      if (mod.promise)
        return this.processImport(await mod.promise, meta, metadata)

      const promise = this.directRequest(id, mod, callstack)
      mod.promise = promise
      mod.evaluated = false
      return this.processImport(await promise, meta, metadata)
    } finally {
      mod.evaluated = true
      if (debugTimer) clearTimeout(debugTimer)
    }
  }

  private async cachedModule(url: string, importer?: string) {
    url = normalizeAbsoluteUrl(url, this.root)

    const normalized = this.urlToIdMap.get(url)
    let cachedModule = normalized && this.moduleCache.getByModuleId(normalized)
    if (!cachedModule) {
      cachedModule = this.moduleCache.getByModuleId(url)
    }

    let cached = this.moduleInfoCache.get(url)
    if (!cached) {
      cached = this.getModuleInformation(url, importer, cachedModule).finally(
        () => {
          this.moduleInfoCache.delete(url)
        },
      )
      this.moduleInfoCache.set(url, cached)
    } else {
      this.debug?.('[module runner] using cached module info for', url)
    }

    return cached
  }

  private async getModuleInformation(
    url: string,
    importer: string | undefined,
    cachedModule: ModuleCache | undefined,
  ): Promise<ModuleCache> {
    if (this.destroyed) {
      throw new Error(`Vite module runner has been destroyed.`)
    }

    this.debug?.('[module runner] fetching', url)

    const isCached = !!(typeof cachedModule === 'object' && cachedModule.meta)

    const fetchedModule = // fast return for established externalized pattern
      (
        url.startsWith('data:')
          ? { externalize: url, type: 'builtin' }
          : await this.transport.fetchModule(url, importer, {
              cached: isCached,
            })
      ) as ResolvedResult

    if ('cache' in fetchedModule) {
      if (!cachedModule || !cachedModule.meta) {
        throw new Error(
          `Module "${url}" was mistakenly invalidated during fetch phase.`,
        )
      }
      return cachedModule
    }

    // base moduleId on "file" and not on id
    // if `import(variable)` is called it's possible that it doesn't have an extension for example
    // if we used id for that, then a module will be duplicated
    const idQuery = url.split('?')[1]
    const query = idQuery ? `?${idQuery}` : ''
    const file = 'file' in fetchedModule ? fetchedModule.file : undefined
    const fileId = file ? `${file}${query}` : url
    const moduleUrl = this.moduleCache.normalize(fileId)
    const mod = this.moduleCache.getByModuleId(moduleUrl)

    if ('invalidate' in fetchedModule && fetchedModule.invalidate) {
      this.moduleCache.invalidateModule(mod)
    }

    fetchedModule.url = moduleUrl
    mod.meta = fetchedModule

    if (file) {
      const fileModules = this.fileToIdMap.get(file) || []
      fileModules.push(moduleUrl)
      this.fileToIdMap.set(file, fileModules)
    }

    this.urlToIdMap.set(url, moduleUrl)
    this.urlToIdMap.set(unwrapId(url), moduleUrl)
    return mod
  }

  // override is allowed, consider this a public API
  protected async directRequest(
    id: string,
    mod: ModuleCache,
    _callstack: string[],
  ): Promise<any> {
    const fetchResult = mod.meta!
    const moduleUrl = fetchResult.url
    const callstack = [..._callstack, moduleUrl]

    const request = async (dep: string, metadata?: SSRImportMetadata) => {
      const importer = ('file' in fetchResult && fetchResult.file) || moduleUrl
      const fetchedModule = await this.cachedModule(dep, importer)
      const resolvedId = fetchedModule.meta!.url
      const depMod = this.moduleCache.getByModuleId(resolvedId)
      depMod.importers!.add(moduleUrl)
      mod.imports!.add(resolvedId)

      return this.cachedRequest(dep, fetchedModule, callstack, metadata)
    }

    const dynamicRequest = async (dep: string) => {
      // it's possible to provide an object with toString() method inside import()
      dep = String(dep)
      if (dep[0] === '.') {
        dep = posixResolve(posixDirname(id), dep)
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
        `[module runner] Failed to load "${id}"${
          importer ? ` imported from ${importer}` : ''
        }`,
      )
    }

    const modulePath = cleanUrl(file || moduleUrl)
    // disambiguate the `<UNIT>:/` on windows: see nodejs/node#31710
    const href = posixPathToFileHref(modulePath)
    const filename = modulePath
    const dirname = posixDirname(modulePath)
    const meta: ModuleRunnerImportMeta = {
      filename: isWindows ? toWindowsPath(filename) : filename,
      dirname: isWindows ? toWindowsPath(dirname) : dirname,
      url: href,
      env: this.envProxy,
      resolve(id, parent) {
        throw new Error(
          '[module runner] "import.meta.resolve" is not supported.',
        )
      },
      // should be replaced during transformation
      glob() {
        throw new Error('[module runner] "import.meta.glob" is not supported.')
      },
    }
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
            throw new Error(`[module runner] HMR client was destroyed.`)
          }
          this.debug?.('[module runner] creating hmr context for', moduleUrl)
          hotContext ||= new HMRContext(this.hmrClient, moduleUrl)
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
      [ssrImportMetaKey]: meta,
    }

    this.debug?.('[module runner] executing', href)

    await this.evaluator.runInlinedModule(context, code, id)

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
    if (key !== 'default' && key !== '__esModule') {
      try {
        Object.defineProperty(exports, key, {
          enumerable: true,
          configurable: true,
          get: () => sourceModule[key],
        })
      } catch (_err) {}
    }
  }
}
