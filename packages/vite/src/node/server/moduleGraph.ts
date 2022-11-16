import { extname } from 'node:path'
import type { ModuleInfo, PartialResolvedId } from 'rollup'
import deepEqual from 'fast-deep-equal'
import { isDirectCSSRequest } from '../plugins/css'
import {
  cleanUrl,
  normalizePath,
  removeDepVersionQuery,
  removeImportQuery,
  removeTimestampQuery
} from '../utils'
import { FS_PREFIX } from '../constants'
import type { TransformResult } from './transformRequest'

export class ModuleNode {
  /**
   * Public served url path, starts with /
   */
  url: string
  file: string
  /**
   * Resolved file system path + query
   */
  id: string | null = null
  type: 'js' | 'css'
  info?: ModuleInfo
  meta?: Record<string, any>
  importers = new Set<ModuleNode>()
  importedModules = new Set<ModuleNode>()
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
   * @param allowHmrPropagation - set `isSelfAccepting` to false to ensure it's
   * never undefined (which prevents HMR update propagation, see #7870)
   */
  constructor(url: string, file: string, isSelfAccepting?: boolean) {
    this.url = url
    this.file = file
    this.type = isDirectCSSRequest(url) ? 'css' : 'js'
    this.isSelfAccepting = isSelfAccepting
  }
}

function invalidateSSRModule(mod: ModuleNode, seen: Set<ModuleNode>) {
  if (seen.has(mod)) {
    return
  }
  seen.add(mod)
  mod.ssrModule = null
  mod.ssrError = null
  mod.importers.forEach((importer) => invalidateSSRModule(importer, seen))
}

export type ResolvedUrl = [
  url: string,
  resolvedId: string,
  meta: object | null | undefined
]

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  fileToModulesMap = new Map<string, Set<ModuleNode>>()
  safeModulesPath = new Set<string>()

  constructor(
    private resolveId: (
      url: string,
      ssr: boolean
    ) => Promise<PartialResolvedId | null>
  ) {}

  async getModuleByUrl(
    rawUrl: string,
    ssr?: boolean
  ): Promise<ModuleNode | undefined> {
    const [url] = await this.resolveUrl(rawUrl, ssr)
    return this.urlToModuleMap.get(url)
  }

  getModuleById(id: string): ModuleNode | undefined {
    const unhashedId = removeDepVersionQuery(id)
    return this.idToModuleMap.get(unhashedId) || this.idToModuleMap.get(id)
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
    timestamp: number = Date.now()
  ): void {
    // Save the timestamp for this invalidation, so we can avoid caching the result of possible already started
    // processing being done for this module
    mod.lastInvalidationTimestamp = timestamp
    // Don't invalidate mod.info and mod.meta, as they are part of the processing pipeline
    // Invalidating the transform result is enough to ensure this module is re-processed next time it is requested
    mod.transformResult = null
    mod.ssrTransformResult = null
    invalidateSSRModule(mod, seen)
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
    ssr?: boolean
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = mod.importedModules
    const nextImports = (mod.importedModules = new Set())
    let noLongerImported: Set<ModuleNode> | undefined
    // update import graph
    for (const imported of importedModules) {
      const dep =
        typeof imported === 'string'
          ? this.urlToModuleMap.get(imported)!
          : imported
      dep.importers.add(mod)
      nextImports.add(dep)
    }
    // remove the importer from deps that were imported but no longer are.
    prevImports.forEach((dep) => {
      if (!nextImports.has(dep)) {
        dep.importers.delete(mod)
        if (!dep.importers.size) {
          // dependency no longer imported
          ;(noLongerImported || (noLongerImported = new Set())).add(dep)
        }
      }
    })
    // update accepted hmr deps
    const deps = (mod.acceptedHmrDeps = new Set())
    for (const accepted of acceptedModules) {
      const dep =
        typeof accepted === 'string'
          ? await this.ensureEntryFromUrl(accepted, ssr, false)
          : accepted
      deps.add(dep)
    }
    // update accepted hmr exports
    mod.acceptedHmrExports = acceptedExports
    mod.importedBindings = importedBindings
    return noLongerImported
  }

  ensureEntryFromResolved(
    [url, resolvedId, meta]: ResolvedUrl,
    isSelfAccepting?: boolean
  ): ModuleNode {
    const unhashedId = removeDepVersionQuery(resolvedId)
    if (this.idToModuleMap.has(unhashedId)) {
      resolvedId = unhashedId
    }
    const modForId = this.idToModuleMap.get(resolvedId)
    const modForUrl = this.urlToModuleMap.get(url)

    // When metadata is derived from the browser URL, we cannot reuse the module
    // node for the resolved Rollup id, as load/transform hooks may use the
    // metadata to produce a different result.
    let mod = (deepEqual(meta, modForId?.meta) && modForId) || modForUrl

    if (!mod) {
      const file = cleanUrl(resolvedId)
      mod = new ModuleNode(url, file, isSelfAccepting)
      mod.id = resolvedId
      if (meta) {
        mod.meta = meta
      }
      this.urlToModuleMap.set(url, mod)
      if (!modForId) {
        this.idToModuleMap.set(resolvedId, mod)
      }
      let fileMappedModules = this.fileToModulesMap.get(file)
      if (!fileMappedModules) {
        fileMappedModules = new Set()
        this.fileToModulesMap.set(file, fileMappedModules)
      }
      fileMappedModules.add(mod)
    }
    // multiple urls can map to the same module and id, make sure we register
    // the url to the existing module in that case
    else if (!modForUrl) {
      this.urlToModuleMap.set(url, mod)
    }

    return mod
  }

  async ensureEntryFromUrl(
    rawUrl: string,
    ssr?: boolean,
    isSelfAccepting?: boolean
  ): Promise<ModuleNode> {
    const resolved = await this.resolveUrl(rawUrl, ssr)
    return this.ensureEntryFromResolved(resolved, isSelfAccepting)
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

    const mod = new ModuleNode(url, file)
    fileMappedModules.add(mod)
    return mod
  }

  // for incoming urls, it is important to:
  // 1. remove the HMR timestamp query (?t=xxxx)
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  async resolveUrl(url: string, ssr?: boolean): Promise<ResolvedUrl> {
    url = removeImportQuery(removeTimestampQuery(url))
    const resolved = await this.resolveId(url, !!ssr)
    const resolvedId = resolved?.id || url
    if (
      url !== resolvedId &&
      !url.includes('\0') &&
      !url.startsWith(`virtual:`)
    ) {
      const ext = extname(cleanUrl(resolvedId))
      const { pathname, search, hash } = new URL(url, 'relative://')
      if (ext && !pathname!.endsWith(ext)) {
        url = pathname + ext + search + hash
      }
    }
    return [url, resolvedId, resolved?.meta]
  }
}
