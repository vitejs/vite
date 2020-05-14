import fs from 'fs'
import path from 'path'
import slash from 'slash'
import { cleanUrl, resolveFrom } from './utils'
import {
  idToFileMap,
  moduleRE,
  fileToRequestMap
} from './server/serverPluginModuleResolve'
import { OPTIMIZE_CACHE_DIR } from './depOptimizer'

export interface Resolver {
  requestToFile(publicPath: string, root: string): string | undefined
  fileToRequest(filePath: string, root: string): string | undefined
  alias?(id: string): string | undefined
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
  alias(id: string): string | undefined
}

const defaultRequestToFile = (publicPath: string, root: string): string => {
  if (moduleRE.test(publicPath)) {
    const moduleFilePath = idToFileMap.get(publicPath.replace(moduleRE, ''))
    if (moduleFilePath) {
      return moduleFilePath
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
    const reoslved = cleanId + inferredExt + query
    debug(`(extension) ${id} -> ${reoslved}`)
    return reoslved
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
        const filepath = r.requestToFile(publicPath, root)
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
        const request = r.fileToRequest(filePath, root)
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

export function resolveBareModule(root: string, id: string) {
  const optimized = resolveOptimizedModule(root, id)
  if (optimized) {
    return id
  }
  const nodeEntry = resolveNodeModule(root, id)
  if (nodeEntry) {
    return nodeEntry
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

  if (!id.endsWith('.js')) id += '.js'
  const file = path.join(root, OPTIMIZE_CACHE_DIR, id)
  if (fs.existsSync(file)) {
    viteOptimizedMap.set(id, file)
    return file
  }
}

const nodeModulesMap = new Map()

export function resolveNodeModule(
  root: string,
  id: string
): string | undefined {
  const cached = nodeModulesMap.get(id)
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
    const pkg = require(pkgPath)
    const entryPoint = id + '/' + (pkg.module || pkg.main || 'index.js')
    debug(`(node_module entry) ${id} -> ${entryPoint}`)
    nodeModulesMap.set(id, entryPoint)
    return entryPoint
  } else {
    // possibly a deep import
    try {
      return resolveFrom(root, id)
    } catch (e) {}

    // no match and no ext, try all exts
    if (!path.extname(id)) {
      for (const ext of supportedExts) {
        try {
          return resolveFrom(root, id + ext)
        } catch (e) {}
      }
    }
  }
}
