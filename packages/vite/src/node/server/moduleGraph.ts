import _debug from 'debug'
import { isCSSRequest, unwrapCSSProxy } from '../plugins/css'
import { cleanUrl, removeTimestampQuery } from '../utils'
import { TransformResult } from './middlewares/transform'

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

  getModuleByUrl(url: string) {
    return this.urlToModuleMap.get(removeTimestampQuery(url))
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

  updateModuleInfo(
    mod: ModuleNode,
    depUrls: Set<string>,
    isHmrBoundary: boolean
  ) {
    mod.isHmrBoundary = isHmrBoundary
    const prevDeps = mod.deps
    const newDeps = (mod.deps = new Set())
    depUrls.forEach((depUrl) => {
      const dep = this.ensureEntry(depUrl)
      dep.importers.add(mod)
      newDeps.add(dep)
    })
    // remove the importer from deps that were imported but no longer are.
    prevDeps.forEach((dep) => {
      if (!newDeps.has(dep)) {
        dep.importers.delete(mod)
      }
    })
  }

  ensureEntry(url: string, resolvedId?: string) {
    url = removeTimestampQuery(url)
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
