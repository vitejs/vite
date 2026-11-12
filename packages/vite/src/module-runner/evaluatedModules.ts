import { SOURCEMAPPING_URL } from '../shared/constants'
import { cleanUrl, isWindows, slash, unwrapId } from '../shared/utils'
import { DecodedMap } from './sourcemap/decoder'
import type { ResolvedResult } from './types'
import { decodeBase64 } from './utils'

const MODULE_RUNNER_SOURCEMAPPING_PREFIX = `//# ${SOURCEMAPPING_URL}=data:application/json;base64,`

export class EvaluatedModuleNode {
  /** ModuleIDs of modules importing this module. */
  public importers: Set<string> = new Set()
  /** ModuleIDs of this module's dependencies. */
  public imports: Set<string> = new Set()
  public evaluated = false
  public meta: ResolvedResult | undefined
  public promise: Promise<any> | undefined
  public exports: any
  public file: string
  public map: DecodedMap | undefined

  constructor(
    /** ModuleID used as the evaluation graph key. */
    public id: string,
    /** ModuleUrl, or external import specifier. */
    public url: string,
  ) {
    this.file = cleanUrl(id)
  }
}

export class EvaluatedModules {
  public readonly idToModuleMap: Map<string, EvaluatedModuleNode> = new Map()
  public readonly fileToModulesMap: Map<string, Set<EvaluatedModuleNode>> =
    new Map()
  public readonly urlToIdModuleMap: Map<string, EvaluatedModuleNode> = new Map()
  private readonly retainedSourceMaps = new Map<string, DecodedMap>()

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
   * Returns the module node by ModuleUrl or ModuleRunnerUrl. Wrapped virtual IDs
   * are unwrapped before lookup. External import specifiers are also accepted.
   * @param url ModuleUrl, ModuleRunnerUrl, or external import specifier
   */
  public getModuleByUrl(url: string): EvaluatedModuleNode | undefined {
    return this.urlToIdModuleMap.get(unwrapId(url))
  }

  /**
   * Ensure that module is in the graph. If the module is already in the graph,
   * it will return the existing module node. Otherwise, it will create a new
   * module node and add it to the graph.
   * @param moduleId Resolved ModuleID, or external import target
   * @param moduleUrl Server ModuleURL, or external import specifier
   */
  public ensureModule(
    moduleId: string,
    moduleUrl: string,
  ): EvaluatedModuleNode {
    moduleId = normalizeModuleId(moduleId)
    if (this.idToModuleMap.has(moduleId)) {
      const moduleNode = this.idToModuleMap.get(moduleId)!
      this.urlToIdModuleMap.set(moduleUrl, moduleNode)
      return moduleNode
    }
    this.retainedSourceMaps.delete(moduleId)
    const moduleNode = new EvaluatedModuleNode(moduleId, moduleUrl)
    this.idToModuleMap.set(moduleId, moduleNode)
    this.urlToIdModuleMap.set(moduleUrl, moduleNode)

    const fileModules = this.fileToModulesMap.get(moduleNode.file) || new Set()
    fileModules.add(moduleNode)
    this.fileToModulesMap.set(moduleNode.file, fileModules)
    return moduleNode
  }

  public invalidateModule(node: EvaluatedModuleNode): void {
    this.retainedSourceMaps.delete(node.id)
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

  public removeModule(
    node: EvaluatedModuleNode,
    options?: { retainSourceMap?: boolean },
  ): void {
    if (options?.retainSourceMap) {
      const map = this.getModuleSourceMapById(node.id)
      if (map) this.retainedSourceMaps.set(node.id, map)
    } else {
      this.retainedSourceMaps.delete(node.id)
    }
    this.fileToModulesMap.delete(node.file)
    this.idToModuleMap.delete(node.id)
    this.urlToIdModuleMap.delete(node.url)
  }

  /**
   * Extracts the inlined source map from the module code and returns the decoded
   * source map. If the source map is not inlined, it will return null.
   * @param id Resolved module ID
   */
  getModuleSourceMapById(id: string): DecodedMap | null {
    const mod = this.getModuleById(id)
    if (!mod) return this.retainedSourceMaps.get(id) ?? null
    if (mod.map) return mod.map
    if (!mod.meta || !('code' in mod.meta)) return null

    const mapString = extractInlineSourceMap(mod.meta.code)
    if (!mapString) return null
    mod.map = new DecodedMap(JSON.parse(decodeBase64(mapString)), mod.file)
    return mod.map
  }

  public clear(): void {
    this.idToModuleMap.clear()
    this.fileToModulesMap.clear()
    this.urlToIdModuleMap.clear()
    this.retainedSourceMaps.clear()
  }
}

// Plain string search rather than a regexp: it's about twice as fast, which
// adds up on modules with large inline maps
function extractInlineSourceMap(code: string): string | undefined {
  const start = code.lastIndexOf(MODULE_RUNNER_SOURCEMAPPING_PREFIX)
  if (start === -1) return
  const dataStart = start + MODULE_RUNNER_SOURCEMAPPING_PREFIX.length
  let dataEnd = code.indexOf('\n', dataStart)
  if (dataEnd === -1) dataEnd = code.length
  if (code.charCodeAt(dataEnd - 1) === 13 /* \r */) dataEnd--
  return code.slice(dataStart, dataEnd)
}

// unique id that is not available as "$bare_import" like "test"
// https://nodejs.org/api/modules.html#built-in-modules-with-mandatory-node-prefix
const prefixedBuiltins = new Set([
  'node:sea',
  'node:sqlite',
  'node:test',
  'node:test/reporters',
])

// Normalize a ModuleID or external import target for the evaluation graph.
// virtual:custom -> virtual:custom
// \0custom -> \0custom
// node:fs -> fs
// /@fs/C:/root/id.js => C:/root/id.js
// file:///C:/root/id.js -> C:/root/id.js
export function normalizeModuleId(moduleId: string): string {
  if (prefixedBuiltins.has(moduleId)) return moduleId

  // unix style, but Windows path still starts with the drive letter to check the root
  const unixId = slash(moduleId)
    .replace(/^\/@fs\//, isWindows ? '' : '/')
    .replace(/^node:/, '')
    .replace(/^\/+/, '/')

  // if it's not in the root, keep it as a path, not a URL
  return unixId.replace(/^file:\/+/, isWindows ? '' : '/')
}
