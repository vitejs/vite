import { extname } from 'path'
import { FAILED_RESOLVE } from '../plugins/resolve'
import { isCSSRequest } from '../plugins/css'
import { cleanUrl, removeTimestampQuery } from '../utils'
import { TransformResult } from './transformRequest'
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
  importedModules = new Set<ModuleNode>()
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

  /**
   * Update the module graph based on a module's updated imports information
   * If there are dependencies that no longer have any importers, they are
   * returned as a Set.
   */
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
    acceptedModules: Set<string | ModuleNode>,
    isSelfAccepting: boolean
  ): Promise<Set<ModuleNode> | undefined> {
    mod.isSelfAccepting = isSelfAccepting
    const prevImports = mod.importedModules
    const nextImports = (mod.importedModules = new Set())
    let noLongerImported: Set<ModuleNode> | undefined
    // update import graph
    for (const imported of importedModules) {
      const dep =
        typeof imported === 'string'
          ? await this.ensureEntryFromUrl(imported)
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
          ? await this.ensureEntryFromUrl(accepted)
          : accepted
      deps.add(dep)
    }
    return noLongerImported
  }

  async ensureEntryFromUrl(rawUrl: string) {
    const [url, resolvedId] = await this.resolveUrl(rawUrl)
    let mod = this.urlToModuleMap.get(url)
    if (!mod) {
      mod = new ModuleNode(url)
      this.urlToModuleMap.set(url, mod)
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

  // some deps, like a css file referenced via @import, don't have its own
  // url because they are inlined into the main css import. But they still
  // need to be represented in the module graph so that they can trigger
  // hmr in the importing css file.
  createFileOnlyEntry(file: string) {
    const url = `/@fs/${file}`
    let fileMappedMdoules = this.fileToModulesMap.get(file)
    if (!fileMappedMdoules) {
      fileMappedMdoules = new Set()
      this.fileToModulesMap.set(file, fileMappedMdoules)
    }
    for (const m of fileMappedMdoules) {
      if (m.url === url) {
        return m
      }
    }
    const mod = new ModuleNode(url)
    mod.file = file
    fileMappedMdoules.add(mod)
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
