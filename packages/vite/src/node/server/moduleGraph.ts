import _debug from 'debug'
import { isCSSRequest } from '../plugins/css'
import { cleanUrl } from '../utils'
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
  transformResult: TransformResult | null = null

  isHmrBoundary = false
  lastUpdated = Date.now()

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
    // TODO remove ?t
    return this.urlToModuleMap.get(url)
  }

  getModuleById(id: string) {
    return this.idToModuleMap.get(id)
  }

  getModulesByFile(file: string) {
    return this.fileToModulesMap.get(file)
  }

  onFileChange(file: string) {
    const mods = this.getModulesByFile(file)
    if (mods) {
      mods.forEach((mod) => {
        mod.transformResult = null
        mod.lastUpdated = Date.now()
      })
    }
  }

  updateModuleInfo(mod: ModuleNode, deps: Set<string>, isHmrBoundary: boolean) {
    // TODO remove ?t
    mod.isHmrBoundary = isHmrBoundary
    const prevDeps = mod.deps
    const newDeps = (mod.deps = new Set())
    deps.forEach((depUrl) => {
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
    // TODO remove ?t
    let mod = this.urlToModuleMap.get(url)
    if (!mod) {
      mod = new ModuleNode(url)
      this.urlToModuleMap.set(url, mod)
    }
    if (resolvedId) {
      mod.id = resolvedId
      this.idToModuleMap.set(resolvedId, mod)
      const file = (mod.file = cleanUrl(resolvedId))
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
