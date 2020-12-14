import { extname } from 'path'
import { FAILED_RESOLVE } from '../plugins/resolve'
import { isCSSRequest, unwrapCSSProxy } from '../plugins/css'
import { cleanUrl, removeTimestampQuery } from '../utils'
import { TransformResult } from './middlewares/transform'
import { PluginContainer } from './pluginContainer'

export class ModuleNode {
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
  importers = new Set<ModuleNode>()
  acceptedHmrDeps = new Set<ModuleNode>()
  isSelfAccepting = false
  transformResult: TransformResult | null = null
  lastHMRTimestamp = 0

  constructor(url: string) {
    this.url = url
    this.type = isCSSRequest(url) ? 'css' : 'js'
  }
}

export class ModuleGraph {
  private urlToModuleMap = new Map<string, ModuleNode>()
  private idToModuleMap = new Map<string, ModuleNode>()
  // a single file may corresponds to multiple modules with different queries
  private fileToModulesMap = new Map<string, Set<ModuleNode>>()
  container: PluginContainer

  constructor(container: PluginContainer) {
    this.container = container
  }

  async getModuleByUrl(rawUrl: string) {
    const [url] = await this.resolveUrl(rawUrl)
    return this.urlToModuleMap.get(url)
  }

  getModuleById(id: string) {
    return this.idToModuleMap.get(removeTimestampQuery(id))
  }

  getModulesByFile(file: string) {
    return this.fileToModulesMap.get(file)
  }

  onFileChange(file: string) {
    const mods = this.getModulesByFile(file)
    if (mods) {
      mods.forEach((mod) => {
        mod.transformResult = null
      })
    }
  }

  async updateModuleInfo(
    mod: ModuleNode,
    importedUrls: Set<string>,
    acceptedUrls: Set<string>,
    isSelfAccepting: boolean
  ) {
    mod.isSelfAccepting = isSelfAccepting
    const prevDeps = mod.acceptedHmrDeps
    const newDeps = (mod.acceptedHmrDeps = new Set())
    for (const depUrl of importedUrls) {
      const dep = await this.ensureEntry(depUrl)
      dep.importers.add(mod)
    }
    for (const depUrl of acceptedUrls) {
      const dep = await this.ensureEntry(depUrl)
      dep.importers.add(mod)
      newDeps.add(dep)
    }
    // remove the importer from deps that were imported but no longer are.
    prevDeps.forEach((dep) => {
      if (!newDeps.has(dep)) {
        dep.importers.delete(mod)
      }
    })
  }

  async ensureEntry(rawUrl: string) {
    const [url, resolvedId] = await this.resolveUrl(rawUrl)
    let mod = this.urlToModuleMap.get(url)
    if (!mod) {
      mod = new ModuleNode(url)
      this.urlToModuleMap.set(url, mod)
      mod.id = resolvedId
      this.idToModuleMap.set(resolvedId, mod)
      const file = (mod.file = unwrapCSSProxy(cleanUrl(resolvedId)))
      let fileMappedMdoules = this.fileToModulesMap.get(file)
      if (!fileMappedMdoules) {
        fileMappedMdoules = new Set()
        this.fileToModulesMap.set(file, fileMappedMdoules)
      }
      fileMappedMdoules.add(mod)
    }
    return mod
  }

  // for incoming urls, it is important to:
  // 1. remove the HMR timestamp query (?t=xxxx)
  // 2. resolve its extension so that urls with or without extension all map to
  // the same module
  async resolveUrl(url: string): Promise<[string, string]> {
    url = removeTimestampQuery(url)
    const resolvedId = (await this.container.resolveId(url)).id
    if (resolvedId === FAILED_RESOLVE) {
      throw Error(`Failed to resolve url: ${url}\nDoes the file exist?`)
    }
    const ext = extname(cleanUrl(resolvedId))
    const [pathname, query] = url.split('?')
    if (ext && !pathname.endsWith(ext)) {
      url = pathname + ext + (query ? `?${query}` : ``)
    }
    return [url, resolvedId]
  }
}
