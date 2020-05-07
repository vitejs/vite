import path from 'path'
import slash from 'slash'
import { statSync } from 'fs'
import { cleanUrl } from './utils'
import {
  idToFileMap,
  moduleRE,
  fileToRequestMap
} from './server/serverPluginModuleResolve'

export interface Resolver {
  requestToFile(publicPath: string, root: string): string | undefined
  fileToRequest(filePath: string, root: string): string | undefined
  idToRequest?(id: string): string | undefined
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
  idToRequest(id: string): string | undefined
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

const defaultIdToRequest = (id: string) => {
  if (id.startsWith('@') && id.indexOf('/') < 0) {
    return `/${id}`
  }
}

export const supportedExts = ['.js', '.ts', '.jsx', '.tsx', '.json']

const debug = require('debug')('vite:resolve')

const resolveExt = (id: string) => {
  const cleanId = cleanUrl(id)
  if (!/\.\w+$/.test(cleanId)) {
    let inferredExt = ''
    for (const ext of supportedExts) {
      try {
        // foo -> foo.js
        statSync(cleanId + ext)
        inferredExt = ext
        break
      } catch (e) {
        try {
          // foo -> foo/index.js
          statSync(path.join(cleanId, '/index' + ext))
          inferredExt = '/index' + ext
          break
        } catch (e) {}
      }
    }
    const queryMatch = id.match(/\?.*$/)
    const query = queryMatch ? queryMatch[0] : ''
    const reoslved = cleanId + inferredExt + query
    debug(`ext: ${id} -> ${reoslved}`)
    return reoslved
  }
  return id
}

export function createResolver(
  root: string,
  resolvers: Resolver[]
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
    idToRequest: (id: string) => {
      for (const r of resolvers) {
        const request = r.idToRequest && r.idToRequest(id)
        if (request) return request
      }
      return defaultIdToRequest(id)
    }
  }
}
