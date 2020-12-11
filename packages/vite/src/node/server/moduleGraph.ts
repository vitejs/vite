import _debug from 'debug'
import { extname } from 'path'
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
  deps = new Set<ModuleNode>()
  importers = new Set<ModuleNode>()
  isHmrBoundary = false
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

  normalizeUrl: (url: string, resolveId?: string) => Promise<string>

  constructor(container: PluginContainer) {
    // for incoming urls, it is important to:
    // 1. remove the HMR timestamp query (?t=xxxx)
    // 2. resolve its extension so that urls with or without extension all map to
    // the same module
    this.normalizeUrl = async (url, resolveId) => {
      url = removeTimestampQuery(url)
      if (!resolveId) {
        resolveId = (await container.resolveId(url))?.id
        if (!resolveId) {
          throw Error(`failed to resolve url to id: ${url}`)
        }
      }
      const ext = extname(cleanUrl(resolveId))
      const [pathname, query] = url.split('?')
      if (ext && !pathname.endsWith(ext)) {
        return pathname + ext + (query ? `?${query}` : ``)
      }
      return url
    }
  }

  async getModuleByUrl(url: string) {
    return this.urlToModuleMap.get(await this.normalizeUrl(url))
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
    depUrls: Set<string>,
    isHmrBoundary: boolean
  ) {
    mod.isHmrBoundary = isHmrBoundary
    const prevDeps = mod.deps
    const newDeps = (mod.deps = new Set())
    for (const depUrl of depUrls) {
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

  async ensureEntry(url: string, resolvedId?: string) {
    url = await this.normalizeUrl(url, resolvedId)
    let mod = this.urlToModuleMap.get(url)
    if (!mod) {
      mod = new ModuleNode(url)
      this.urlToModuleMap.set(url, mod)
    }
    if (resolvedId) {
      resolvedId = removeTimestampQuery(resolvedId)
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
}
