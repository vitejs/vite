import { cleanUrl, isWindows, slash, unwrapId } from '../shared/utils'
import { SOURCEMAPPING_URL } from '../shared/constants'
import { decodeBase64 } from './utils'
import { DecodedMap } from './sourcemap/decoder'
import type { ResolvedResult } from './types'

const MODULE_RUNNER_SOURCEMAPPING_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json;base64,(.+)`,
)

export class EvaluatedModuleNode {
  public importers = new Set<string>()
  public imports = new Set<string>()
  public evaluated = false
  public meta: ResolvedResult | undefined
  public promise: Promise<any> | undefined
  public exports: any | undefined
  public file: string
  public map: DecodedMap | undefined

  constructor(
    public id: string,
    public url: string,
  ) {
    this.file = cleanUrl(id)
  }
}

export class EvaluatedModules {
  public readonly idToModuleMap = new Map<string, EvaluatedModuleNode>()
  public readonly fileToModulesMap = new Map<string, Set<EvaluatedModuleNode>>()
  public readonly urlToIdModuleMap = new Map<string, EvaluatedModuleNode>()

  /**
   * Returns the module node by the resolved module ID. Usually, module ID is
   * the file system path with query and/or hash. It can also be a virtual module.
   *
   * Module runner graph will have 1 to 1 mapping with the server module graph.
   * @param id Resolved module ID
   */
  public getModuleById(id: string): EvaluatedModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }

  /**
   * Returns all modules related to the file system path. Different modules
   * might have different query parameters or hash, so it's possible to have
   * multiple modules for the same file.
   * @param file The file system path of the module
   */
  public getModulesByFile(file: string): Set<EvaluatedModuleNode> | undefined {
    return this.fileToModulesMap.get(file)
  }

  /**
   * Returns the module node by the URL that was used in the import statement.
   * Unlike module graph on the server, the URL is not resolved and is used as is.
   * @param url Server URL that was used in the import statement
   */
  public getModuleByUrl(url: string): EvaluatedModuleNode | undefined {
    return this.urlToIdModuleMap.get(unwrapId(url))
  }

  /**
   * Ensure that module is in the graph. If the module is already in the graph,
   * it will return the existing module node. Otherwise, it will create a new
   * module node and add it to the graph.
   * @param id Resolved module ID
   * @param url URL that was used in the import statement
   */
  public ensureModule(id: string, url: string): EvaluatedModuleNode {
    id = normalizeModuleId(id)
    if (this.idToModuleMap.has(id)) {
      const moduleNode = this.idToModuleMap.get(id)!
      this.urlToIdModuleMap.set(url, moduleNode)
      return moduleNode
    }
    const moduleNode = new EvaluatedModuleNode(id, url)
    this.idToModuleMap.set(id, moduleNode)
    this.urlToIdModuleMap.set(url, moduleNode)

    const fileModules = this.fileToModulesMap.get(moduleNode.file) || new Set()
    fileModules.add(moduleNode)
    this.fileToModulesMap.set(moduleNode.file, fileModules)
    return moduleNode
  }

  public invalidateModule(node: EvaluatedModuleNode): void {
    node.evaluated = false
    node.meta = undefined
    node.map = undefined
    node.promise = undefined
    node.exports = undefined
    // remove imports in case they are changed,
    // don't remove the importers because otherwise it will be empty after evaluation
    // this can create a bug when file was removed but it still triggers full-reload
    // we are fine with the bug for now because it's not a common case
    node.imports.clear()
  }

  /**
   * Extracts the inlined source map from the module code and returns the decoded
   * source map. If the source map is not inlined, it will return null.
   * @param id Resolved module ID
   */
  getModuleSourceMapById(id: string): DecodedMap | null {
    const mod = this.getModuleById(id)
    if (!mod) return null
    if (mod.map) return mod.map
    if (!mod.meta || !('code' in mod.meta)) return null
    const mapString = MODULE_RUNNER_SOURCEMAPPING_REGEXP.exec(
      mod.meta.code,
    )?.[1]
    if (!mapString) return null
    mod.map = new DecodedMap(JSON.parse(decodeBase64(mapString)), mod.file)
    return mod.map
  }

  public clear(): void {
    this.idToModuleMap.clear()
    this.fileToModulesMap.clear()
    this.urlToIdModuleMap.clear()
  }
}

// unique id that is not available as "$bare_import" like "test"
const prefixedBuiltins = new Set(['node:test', 'node:sqlite'])

// transform file url to id
// virtual:custom -> virtual:custom
// \0custom -> \0custom
// /root/id -> /id
// /root/id.js -> /id.js
// C:/root/id.js -> /id.js
// C:\root\id.js -> /id.js
function normalizeModuleId(file: string): string {
  if (prefixedBuiltins.has(file)) return file

  // unix style, but Windows path still starts with the drive letter to check the root
  const unixFile = slash(file)
    .replace(/^\/@fs\//, isWindows ? '' : '/')
    .replace(/^node:/, '')
    .replace(/^\/+/, '/')

  // if it's not in the root, keep it as a path, not a URL
  return unixFile.replace(/^file:\//, '/')
}
