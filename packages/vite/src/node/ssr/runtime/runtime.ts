import type { ViteHotContext } from 'types/hot'
import { HMRClient, HMRContext } from '../../../shared/hmr'
import { ModuleCacheMap } from './moduleCache'
import type {
  FetchResult,
  ImportMetaEnv,
  ModuleCache,
  ResolvedResult,
  SSRImportMetadata,
  ViteModuleRunner,
  ViteRuntimeImportMeta,
  ViteRuntimeModuleContext,
  ViteServerClientOptions,
} from './types'
import {
  cleanUrl,
  createImportMetaEnvProxy,
  isPrimitive,
  isWindows,
  posixDirname,
  posixPathToFileHref,
  posixResolve,
  toWindowsPath,
  unwrapId,
  wrapId,
} from './utils'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './constants'
import { silentConsole } from './hmrLogger'
import { createHMRHandler } from './hmrHandler'

interface ViteRuntimeDebugger {
  (formatter: unknown, ...args: unknown[]): void
}

export class ViteRuntime {
  /**
   * Holds the cache of modules
   * Keys of the map are ids
   */
  public moduleCache: ModuleCacheMap
  public hmrClient?: HMRClient
  public entrypoints = new Set<string>()

  private idToUrlMap = new Map<string, string>()
  private envProxy: ImportMetaEnv

  constructor(
    public options: ViteServerClientOptions,
    public runner: ViteModuleRunner,
    private debug?: ViteRuntimeDebugger,
  ) {
    this.moduleCache = options.moduleCache ?? new ModuleCacheMap(options.root)
    this.envProxy = createImportMetaEnvProxy(options.environmentVariables)
    if (typeof options.hmr === 'object') {
      this.hmrClient = new HMRClient(
        options.hmr.logger === false
          ? silentConsole
          : options.hmr.logger || console,
        options.hmr.connection,
        ({ acceptedPath, ssrInvalidates }) => {
          this.moduleCache.delete(acceptedPath)
          ssrInvalidates?.forEach((id) => this.moduleCache.delete(id))
          return this.executeUrl(acceptedPath)
        },
      )
      options.hmr.connection.onUpdate(createHMRHandler(this))
    }
  }

  /**
   * URL to execute. Accepts file path, server path or id relative to the root.
   */
  public async executeUrl<T = any>(url: string): Promise<T> {
    url = this.normalizeEntryUrl(url)
    const fetchedModule = await this.cachedModule(url)
    return await this.cachedRequest(url, fetchedModule)
  }

  /**
   * Entrypoint URL to execute. Accepts file path, server path or id relative to the root.
   * In the case of a full reload triggered by HMR, these are the modules that will be reloaded
   */
  public async executeEntrypoint<T = any>(url: string): Promise<T> {
    url = this.normalizeEntryUrl(url)
    const fetchedModule = await this.cachedModule(url)
    return await this.cachedRequest(url, fetchedModule, [], {
      entrypoint: true,
    })
  }

  public clearCache(): void {
    this.moduleCache.clear()
    this.idToUrlMap.clear()
    this.entrypoints.clear()
    this.hmrClient?.clear()
  }

  // we don't use moduleCache.normalize because this URL doesn't have to follow the same rules
  // this URL is something that user passes down manually, and is later resolved by fetchModule
  // moduleCache.normalize is used on resolved "file" property
  private normalizeEntryUrl(url: string) {
    // expect fetchModule to resolve relative module correctly
    if (url[0] === '.') {
      return url
    }
    // file:///C:/root/id.js -> C:/root/id.js
    if (url.startsWith('file://')) {
      // 8 is the length of "file:///"
      url = url.slice(isWindows ? 8 : 7)
    }
    url = url.replace(/\\/g, '/')
    const _root = this.options.root
    const root = _root[_root.length - 1] === '/' ? _root : `${_root}/`
    // strip root from the URL because fetchModule prefers a public served url path
    // packages/vite/src/node/server/moduleGraph.ts:17
    if (url.startsWith(root)) {
      // /root/id.js -> /id.js
      // C:/root/id.js -> /id.js
      // 1 is to keep the leading slash
      return url.slice(root.length - 1)
    }
    // if it's a server url (starts with a slash), keep it, otherwise assume a virtual module
    // /id.js -> /id.js
    // virtual:custom -> /@id/virtual:custom
    return url[0] === '/' ? url : wrapId(url)
  }

  private processImport(
    exports: Record<string, any>,
    fetchResult: ResolvedResult,
    metadata?: SSRImportMetadata,
  ) {
    if (!this.runner.processImport) {
      return exports
    }
    return this.runner.processImport(exports, fetchResult, metadata)
  }

  private async cachedRequest(
    id: string,
    fetchedModule: ResolvedResult,
    callstack: string[] = [],
    metadata?: SSRImportMetadata,
  ): Promise<any> {
    const moduleId = fetchedModule.id

    if (metadata?.entrypoint) {
      this.entrypoints.add(moduleId)
    }

    const mod = this.moduleCache.getByModuleId(moduleId)

    const { imports, importers } = mod as Required<ModuleCache>

    const importee = callstack[callstack.length - 1]

    if (importee) importers.add(importee)

    // check circular dependency
    if (
      callstack.includes(moduleId) ||
      Array.from(imports.values()).some((i) => importers.has(i))
    ) {
      if (mod.exports)
        return this.processImport(mod.exports, fetchedModule, metadata)
    }

    const getStack = () =>
      `stack:\n${[...callstack, moduleId]
        .reverse()
        .map((p) => `  - ${p}`)
        .join('\n')}`

    let debugTimer: any
    if (this.debug)
      debugTimer = setTimeout(
        () =>
          this.debug!(
            `[vite-runtime] module ${moduleId} takes over 2s to load.\n${getStack()}`,
          ),
        2000,
      )

    try {
      // cached module
      if (mod.promise)
        return this.processImport(await mod.promise, fetchedModule, metadata)

      const promise = this.directRequest(id, fetchedModule, callstack, metadata)
      mod.promise = promise
      mod.evaluated = false
      return this.processImport(await promise, fetchedModule, metadata)
    } finally {
      mod.evaluated = true
      if (debugTimer) clearTimeout(debugTimer)
    }
  }

  private async cachedModule(
    id: string,
    importer?: string,
  ): Promise<ResolvedResult> {
    const normalized = this.idToUrlMap.get(id)
    if (normalized) {
      const mod = this.moduleCache.getByModuleId(normalized)
      if (mod.meta) {
        return mod.meta as ResolvedResult
      }
    }
    this.debug?.('[vite-runtime] fetching', id)
    // fast return for established externalized patterns
    const fetchedModule = id.startsWith('data:')
      ? ({ externalize: id, type: 'builtin' } as FetchResult)
      : await this.options.fetchModule(id, importer)
    // base moduleId on "file" and not on id
    // if `import(variable)` is called it's possible that it doesn't have an extension for example
    // if we used id for that, it's possible to have a duplicated module
    const idQuery = id.split('?')[1]
    const query = idQuery ? `?${idQuery}` : ''
    const fullFile = fetchedModule.file ? `${fetchedModule.file}${query}` : id
    const moduleId = this.moduleCache.normalize(fullFile)
    const mod = this.moduleCache.getByModuleId(moduleId)
    fetchedModule.id = moduleId
    mod.meta = fetchedModule
    this.idToUrlMap.set(id, moduleId)
    this.idToUrlMap.set(unwrapId(id), moduleId)
    return fetchedModule as ResolvedResult
  }

  // override is allowed, consider this a public API
  protected async directRequest(
    id: string,
    { file, externalize, code, id: moduleId }: ResolvedResult,
    _callstack: string[],
    metadata?: SSRImportMetadata,
  ): Promise<any> {
    const callstack = [..._callstack, moduleId]

    const mod = this.moduleCache.getByModuleId(moduleId)

    const request = async (dep: string, metadata?: SSRImportMetadata) => {
      const fetchedModule = await this.cachedModule(dep, moduleId)
      const depMod = this.moduleCache.getByModuleId(fetchedModule.id)
      depMod.importers!.add(moduleId)
      mod.imports!.add(fetchedModule.id)

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

    const requestStubs = this.options.requestStubs || {}
    if (id in requestStubs) return requestStubs[id]

    if (externalize) {
      this.debug?.('[vite-runtime] externalizing', externalize)
      const exports = await this.runner.runExternalModule(externalize, metadata)
      mod.exports = exports
      return exports
    }

    if (code == null) {
      const importer = callstack[callstack.length - 2]
      throw new Error(
        `[vite-runtime] Failed to load "${id}"${
          importer ? ` imported from ${importer}` : ''
        }`,
      )
    }

    const modulePath = cleanUrl(file || moduleId)
    // disambiguate the `<UNIT>:/` on windows: see nodejs/node#31710
    const href = posixPathToFileHref(modulePath)
    const filename = modulePath
    const dirname = posixDirname(modulePath)
    const meta: ViteRuntimeImportMeta = {
      filename: isWindows ? toWindowsPath(filename) : filename,
      dirname: isWindows ? toWindowsPath(dirname) : dirname,
      url: href,
      env: this.envProxy,
      resolve(id, parent) {
        throw new Error(
          '[vite-runtime] "import.meta.resolve" is not supported.',
        )
      },
      // should be replaced during transformation
      glob() {
        throw new Error('[vite-runtime] "import.meta.glob" is not supported.')
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
          this.debug?.('[vite-runtime] creating hmr context for', moduleId)
          hotContext ||= new HMRContext(this.hmrClient!, moduleId)
          return hotContext
        },
        set: (value) => {
          hotContext = value
        },
      })
    }

    const context: ViteRuntimeModuleContext = {
      [ssrImportKey]: request,
      [ssrDynamicImportKey]: dynamicRequest,
      [ssrModuleExportsKey]: exports,
      [ssrExportAllKey]: (obj: any) => exportAll(exports, obj),
      [ssrImportMetaKey]: meta,
    }

    this.debug?.('[vite-runtime] executing', href)

    await this.runner.runViteModule(context, code, id, metadata)

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
