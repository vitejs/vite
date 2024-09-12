import {
  cleanUrl,
  isWindows,
  slash,
  unwrapId,
  withTrailingSlash,
} from '../shared/utils'
import { SOURCEMAPPING_URL } from '../shared/constants'
import { decodeBase64, posixResolve } from './utils'
import { DecodedMap } from './sourcemap/decoder'
import type { ResolvedResult } from './types'

const MODULE_RUNNER_SOURCEMAPPING_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json;base64,(.+)`,
)

export class ModuleRunnerNode {
  public importers = new Set<string>()
  public imports = new Set<string>()
  public lastInvalidationTimestamp = 0
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
    this.file = cleanUrl(url)
  }
}

export class ModuleRunnerGraph {
  private root: string

  public idToModuleMap = new Map<string, ModuleRunnerNode>()
  public fileToModuleMap = new Map<string, ModuleRunnerNode[]>()

  constructor(root: string) {
    this.root = withTrailingSlash(root)
  }

  public getModuleById(id: string): ModuleRunnerNode | undefined {
    return this.idToModuleMap.get(id)
  }

  public getModulesByFile(file: string): ModuleRunnerNode[] {
    return this.fileToModuleMap.get(file) || []
  }

  public getModuleByUrl(url: string): ModuleRunnerNode | undefined {
    url = unwrapId(url)
    if (url.startsWith('/')) {
      const id = posixResolve(this.root, url.slice(1))
      return this.idToModuleMap.get(id)
    }
    return this.idToModuleMap.get(url)
  }

  public ensureModule(id: string, url: string): ModuleRunnerNode {
    id = normalizeModuleId(id)
    if (this.idToModuleMap.has(id)) {
      return this.idToModuleMap.get(id)!
    }
    const moduleNode = new ModuleRunnerNode(id, url)
    this.idToModuleMap.set(id, moduleNode)

    const fileModules = this.fileToModuleMap.get(moduleNode.file) || []
    fileModules.push(moduleNode)
    this.fileToModuleMap.set(moduleNode.file, fileModules)
    return moduleNode
  }

  public invalidateModule(node: ModuleRunnerNode): void {
    node.evaluated = false
    node.meta = undefined
    node.map = undefined
    node.promise = undefined
    node.exports = undefined
    // remove imports in case they are changed,
    // don't remove the importers because otherwise it will be empty after evaluation
    // this can create a bug when file was removed but it still triggers full-reload
    // we are fine with the bug for now because it's not a common case
    node.imports?.clear()
  }

  getModuleSourceMapById(id: string): null | DecodedMap {
    const mod = this.getModuleById(id)
    if (!mod) return null
    if (mod.map) return mod.map
    if (!mod.meta || !('code' in mod.meta)) return null
    const mapString = MODULE_RUNNER_SOURCEMAPPING_REGEXP.exec(
      mod.meta.code,
    )?.[1]
    if (!mapString) return null
    const baseFile = mod.file
    mod.map = new DecodedMap(JSON.parse(decodeBase64(mapString)), baseFile)
    return mod.map
  }

  public clear(): void {
    this.idToModuleMap.clear()
    this.fileToModuleMap.clear()
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
