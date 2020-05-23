import fs from 'fs'
import path from 'path'
import slash from 'slash'
import { cleanUrl, resolveFrom } from './utils'
import {
  idToFileMap,
  moduleRE,
  fileToRequestMap
} from './server/serverPluginModuleResolve'
import { resolveOptimizedCacheDir } from './depOptimizer'
import chalk from 'chalk'

export interface Resolver {
  requestToFile?(publicPath: string, root: string): string | undefined
  fileToRequest?(filePath: string, root: string): string | undefined
  alias?(id: string): string | undefined
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
  alias(id: string): string | undefined
}

const defaultRequestToFile = (publicPath: string, root: string): string => {
  if (moduleRE.test(publicPath)) {
    const id = publicPath.replace(moduleRE, '')
    // try to resolve from optimized modules
    const optimizedModule = resolveOptimizedModule(root, id)
    if (optimizedModule) {
      return optimizedModule
    }
    // try to resolve from normal node_modules
    const cachedNodeModule = idToFileMap.get(id)
    if (cachedNodeModule) {
      return cachedNodeModule
    }
    const nodeModule = resolveNodeModuleFile(root, id)
    if (nodeModule) {
      idToFileMap.set(id, nodeModule)
      return nodeModule
    }
  }
  return path.join(root, publicPath.slice(1))
}

const defaultFileToRequest = (filePath: string, root: string): string => {
  const moduleRequest = fileToRequestMap.get(filePath)
  if (moduleRequest) {
    return moduleRequest
  }
  return `/${slash(path.relative(root, filePath))}`
}

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']

const debug = require('debug')('vite:resolve')

export const resolveExt = (id: string) => {
  const cleanId = cleanUrl(id)
  if (!path.extname(cleanId)) {
    let inferredExt = ''
    for (const ext of supportedExts) {
      try {
        // foo -> foo.js
        fs.statSync(cleanId + ext)
        inferredExt = ext
        break
      } catch (e) {
        try {
          // foo -> foo/index.js
          fs.statSync(path.join(cleanId, '/index' + ext))
          inferredExt = '/index' + ext
          break
        } catch (e) {}
      }
    }
    const queryMatch = id.match(/\?.*$/)
    const query = queryMatch ? queryMatch[0] : ''
    const resolved = cleanId + inferredExt + query
    debug(`(extension) ${id} -> ${resolved}`)
    return resolved
  }
  return id
}

export function createResolver(
  root: string,
  resolvers: Resolver[] = [],
  alias: Record<string, string> = {}
): InternalResolver {
  return {
    requestToFile: (publicPath) => {
      let resolved: string | undefined
      for (const r of resolvers) {
        const filepath = r.requestToFile && r.requestToFile(publicPath, root)
        if (filepath) {
          resolved = filepath
          break
        }
      }
      if (!resolved) {
        resolved = defaultRequestToFile(publicPath, root)
      }
      resolved = resolveExt(resolved)
      return resolved
    },
    fileToRequest: (filePath) => {
      for (const r of resolvers) {
        const request = r.fileToRequest && r.fileToRequest(filePath, root)
        if (request) return request
      }
      return defaultFileToRequest(filePath, root)
    },
    alias: (id: string) => {
      let aliased: string | undefined = alias[id]
      if (aliased) {
        return aliased
      }
      for (const r of resolvers) {
        aliased = r.alias && r.alias(id)
        if (aliased) {
          return aliased
        }
      }
    }
  }
}

export const jsSrcRE = /\.(?:(?:j|t)sx?|vue)$|\.mjs$/
const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

export function resolveBareModule(root: string, id: string, importer: string) {
  const optimized = resolveOptimizedModule(root, id)
  if (optimized) {
    return id
  }
  const pkgInfo = resolveNodeModule(root, id)
  if (pkgInfo) {
    return pkgInfo.entry
  }

  // check and warn deep imports on optimized modules
  const ext = path.extname(id)
  if (!ext || jsSrcRE.test(ext)) {
    const deepMatch = id.match(deepImportRE)
    if (deepMatch) {
      const depId = deepMatch[1] || deepMatch[2]
      if (resolveOptimizedModule(root, depId)) {
        console.error(
          chalk.yellow(
            `\n[vite] Avoid deep import "${id}" since "${depId}" is a ` +
              `pre-optimized dependency.\n` +
              `Prefer importing from the module directly.\n` +
              `Importer: ${importer}\n`
          )
        )
      }
    }
  }
  return id
}

const viteOptimizedMap = new Map()

export function resolveOptimizedModule(
  root: string,
  id: string
): string | undefined {
  const cached = viteOptimizedMap.get(id)
  if (cached) {
    return cached
  }

  const cacheDir = resolveOptimizedCacheDir(root)
  if (!cacheDir) return
  const file = path.join(cacheDir, id)
  if (fs.existsSync(file)) {
    viteOptimizedMap.set(id, file)
    return file
  }
}

interface NodeModuleInfo {
  entry: string
  entryFilePath: string
  pkg: any
}
const nodeModulesInfoMap = new Map<string, NodeModuleInfo>()
const nodeModulesFileMap = new Map()

export function resolveNodeModule(
  root: string,
  id: string
): NodeModuleInfo | undefined {
  const cached = nodeModulesInfoMap.get(id)
  if (cached) {
    return cached
  }
  let pkgPath
  try {
    // see if the id is a valid package name
    pkgPath = resolveFrom(root, `${id}/package.json`)
  } catch (e) {}

  if (pkgPath) {
    // if yes, this is a entry import. resolve entry file
    let pkg
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    } catch (e) {
      return
    }
    let entryPoint: string | undefined
    if (pkg.exports) {
      if (typeof pkg.exports === 'string') {
        entryPoint = pkg.exports
      } else if (pkg.exports['.']) {
        if (typeof pkg.exports['.'] === 'string') {
          entryPoint = pkg.exports['.']
        } else {
          entryPoint = pkg.exports['.'].import
        }
      }
    }
    if (!entryPoint) {
      entryPoint = pkg.module || pkg.main || 'index.js'
    }

    debug(`(node_module entry) ${id} -> ${entryPoint}`)

    const entryFilePath = path.join(path.dirname(pkgPath), entryPoint!)

    // save resolved entry file path using the deep import path as key
    // e.g. foo/dist/foo.js
    // this is the path raw imports will be rewritten to, and is what will
    // be passed to resolveNodeModuleFile().
    entryPoint = path.posix.join(id, entryPoint!)

    // save the resolved file path now so we don't need to do it again in
    // resolveNodeModuleFile()
    nodeModulesFileMap.set(entryPoint, entryFilePath)

    const result: NodeModuleInfo = {
      entry: entryPoint!,
      entryFilePath,
      pkg
    }
    nodeModulesInfoMap.set(id, result)
    return result
  }
}

export function resolveNodeModuleFile(
  root: string,
  id: string
): string | undefined {
  const cached = nodeModulesFileMap.get(id)
  if (cached) {
    return cached
  }
  try {
    const resolved = resolveFrom(root, id)
    nodeModulesFileMap.set(id, resolved)
    return resolved
  } catch (e) {
    // error will be reported downstream
  }
}
