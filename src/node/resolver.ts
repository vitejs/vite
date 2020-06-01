import fs from 'fs-extra'
import path from 'path'
import slash from 'slash'
import { cleanUrl, resolveFrom, queryRE } from './utils'
import {
  moduleRE,
  moduleIdToFileMap,
  moduleFileToIdMap
} from './server/serverPluginModuleResolve'
import { resolveOptimizedCacheDir } from './depOptimizer'
import chalk from 'chalk'

const debug = require('debug')('vite:resolve')

export interface Resolver {
  requestToFile?(publicPath: string, root: string): string | undefined
  fileToRequest?(filePath: string, root: string): string | undefined
  alias?: ((id: string) => string | undefined) | Record<string, string>
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
  alias(id: string): string | undefined
  resolveExt(publicPath: string): string | undefined
}

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
export const mainFields = ['module', 'jsnext', 'jsnext:main', 'browser', 'main']

const defaultRequestToFile = (publicPath: string, root: string): string => {
  if (moduleRE.test(publicPath)) {
    const id = publicPath.replace(moduleRE, '')
    const cachedNodeModule = moduleIdToFileMap.get(id)
    if (cachedNodeModule) {
      return cachedNodeModule
    }
    // try to resolve from optimized modules
    const optimizedModule = resolveOptimizedModule(root, id)
    if (optimizedModule) {
      return optimizedModule
    }
    // try to resolve from normal node_modules
    const nodeModule = resolveNodeModuleFile(root, id)
    if (nodeModule) {
      moduleIdToFileMap.set(id, nodeModule)
      return nodeModule
    }
  }
  const publicDirPath = path.join(root, 'public', publicPath.slice(1))
  if (fs.existsSync(publicDirPath)) {
    return publicDirPath
  }
  return path.join(root, publicPath.slice(1))
}

const defaultFileToRequest = (filePath: string, root: string): string => {
  const moduleRequest = moduleFileToIdMap.get(filePath)
  if (moduleRequest) {
    return moduleRequest
  }
  return `/${slash(path.relative(root, filePath))}`
}

const isFile = (file: string): boolean => {
  try {
    return fs.statSync(file).isFile()
  } catch (e) {
    return false
  }
}

const resolveExt = (id: string): string | undefined => {
  const cleanId = cleanUrl(id)
  if (!isFile(cleanId)) {
    let inferredExt = ''
    for (const ext of supportedExts) {
      if (isFile(cleanId + ext)) {
        inferredExt = ext
        break
      }
      if (isFile(path.join(cleanId, '/index' + ext))) {
        inferredExt = '/index' + ext
        break
      }
    }
    const queryMatch = id.match(/\?.*$/)
    const query = queryMatch ? queryMatch[0] : ''
    const resolved = cleanId + inferredExt + query
    if (resolved !== id) {
      debug(`(extension) ${id} -> ${resolved}`)
      return inferredExt
    }
  }
}

const isDir = (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory()

export function createResolver(
  root: string,
  resolvers: Resolver[] = [],
  userAlias: Record<string, string> = {}
): InternalResolver {
  resolvers = [...resolvers]
  const literalAlias: Record<string, string> = {}

  const resolveAlias = (alias: Record<string, string>) => {
    for (const key in alias) {
      let target = alias[key]
      // aliasing a directory
      if (key.startsWith('/') && key.endsWith('/') && path.isAbsolute(target)) {
        // check first if this is aliasing to a path from root
        const fromRoot = path.join(root, target)
        if (isDir(fromRoot)) {
          target = fromRoot
        } else if (!isDir(target)) {
          continue
        }
        resolvers.push({
          requestToFile(publicPath) {
            if (publicPath.startsWith(key)) {
              return path.join(target, publicPath.slice(key.length))
            }
          },
          fileToRequest(filePath) {
            if (filePath.startsWith(target)) {
              return slash(key + path.relative(target, filePath))
            }
          }
        })
      } else {
        literalAlias[key] = target
      }
    }
  }

  resolvers.forEach((r) => {
    if (r.alias && typeof r.alias === 'object') {
      resolveAlias(r.alias)
    }
  })
  resolveAlias(userAlias)

  const requestToFileCache = new Map()
  const fileToRequestCache = new Map()

  const resolveRequest = (
    publicPath: string
  ): {
    filePath: string
    ext: string | undefined
  } => {
    if (requestToFileCache.has(publicPath)) {
      return requestToFileCache.get(publicPath)
    }

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
    const ext = resolveExt(resolved)
    const result = {
      filePath: ext ? resolved + ext : resolved,
      ext: ext || path.extname(resolved)
    }
    requestToFileCache.set(publicPath, result)
    return result
  }

  return {
    requestToFile(publicPath) {
      return resolveRequest(publicPath).filePath
    },

    resolveExt(publicPath) {
      return resolveRequest(publicPath).ext
    },

    fileToRequest(filePath) {
      if (fileToRequestCache.has(filePath)) {
        return fileToRequestCache.get(filePath)
      }
      for (const r of resolvers) {
        const request = r.fileToRequest && r.fileToRequest(filePath, root)
        if (request) return request
      }
      const res = defaultFileToRequest(filePath, root)
      fileToRequestCache.set(filePath, res)
      return res
    },

    alias(id) {
      let aliased: string | undefined = literalAlias[id]
      if (aliased) {
        return aliased
      }
      for (const r of resolvers) {
        aliased =
          r.alias && typeof r.alias === 'function' ? r.alias(id) : undefined
        if (aliased) {
          return aliased
        }
      }
    }
  }
}

export const jsSrcRE = /\.(?:(?:j|t)sx?|vue)$|\.mjs$/
const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

/**
 * Redirects a bare module request to a full path under /@modules/
 * It resolves a bare node module id to its full entry path so that relative
 * imports from the entry can be correctly resolved.
 * e.g.:
 * - `import 'foo'` -> `import '/@modules/foo/dist/index.js'`
 * - `import 'foo/bar/baz'` -> `import '/@modules/foo/bar/baz'`
 */
export function resolveBareModuleRequest(
  root: string,
  id: string,
  importer: string,
  resolver: InternalResolver
): string {
  const optimized = resolveOptimizedModule(root, id)
  if (optimized) {
    // ensure optimized module requests always ends with `.js` - this is because
    // optimized deps may import one another and in the built bundle their
    // relative import paths ends with `.js`. If we don't append `.js` during
    // rewrites, it may result in duplicated copies of the same dep.
    return path.extname(id) === '.js' ? id : id + '.js'
  }

  let isEntry = false
  const basedir = path.dirname(resolver.requestToFile(importer))
  const pkgInfo = resolveNodeModule(basedir, id)
  if (pkgInfo) {
    if (!pkgInfo.entry) {
      console.error(
        chalk.yellow(
          `[vite] dependency ${id} does not have default entry defined in ` +
            `package.json.`
        )
      )
    } else {
      isEntry = true
      id = pkgInfo.entry
    }
  }

  // check and warn deep imports on optimized modules
  const ext = path.extname(id)
  if (!ext || jsSrcRE.test(ext)) {
    const deepMatch = !isEntry && id.match(deepImportRE)
    if (deepMatch) {
      const depId = deepMatch[1] || deepMatch[2]
      if (resolveOptimizedModule(root, depId)) {
        console.error(
          chalk.yellow(
            `\n[vite] Avoid deep import "${id}" (imported by ${importer})\n` +
              `because "${depId}" has been pre-optimized by vite into a single file.\n` +
              `Prefer importing directly from the module entry:\n` +
              chalk.cyan(`\n  import { ... } from "${depId}" \n\n`) +
              `If the dependency requires deep import to function properly, \n` +
              `add the deep path to ${chalk.cyan(
                `optimizeDeps.include`
              )} in vite.config.js.\n`
          )
        )
      }
    }
    return id
  } else {
    // append import query for non-js deep imports
    return id + (queryRE.test(id) ? '&import' : '?import')
  }
}

const viteOptimizedMap = new Map()

export function resolveOptimizedModule(
  root: string,
  id: string
): string | undefined {
  const cacheKey = `${root}#${id}`
  const cached = viteOptimizedMap.get(cacheKey)
  if (cached) {
    return cached
  }

  const cacheDir = resolveOptimizedCacheDir(root)
  if (!cacheDir) return
  if (!path.extname(id)) id += '.js'
  const file = path.join(cacheDir, id)
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    viteOptimizedMap.set(cacheKey, file)
    return file
  }
}

interface NodeModuleInfo {
  entry: string | null
  entryFilePath: string | null
  pkg: any
}
const nodeModulesInfoMap = new Map<string, NodeModuleInfo>()
const nodeModulesFileMap = new Map()

export function resolveNodeModule(
  root: string,
  id: string
): NodeModuleInfo | undefined {
  const cacheKey = `${root}#${id}`
  const cached = nodeModulesInfoMap.get(cacheKey)
  if (cached) {
    return cached
  }
  let pkgPath
  try {
    // see if the id is a valid package name
    pkgPath = resolveFrom(root, `${id}/package.json`)
  } catch (e) {
    debug(`failed to resolve package.json for ${id}`)
  }

  if (pkgPath) {
    // if yes, this is a entry import. resolve entry file
    let pkg
    try {
      pkg = fs.readJSONSync(pkgPath)
    } catch (e) {
      return
    }
    let entryPoint: string | null = null

    // TODO properly support conditinal exports
    // https://nodejs.org/api/esm.html#esm_conditional_exports
    // Note: this would require @rollup/plugin-node-resolve to support it too
    // or we will have to implement that logic in vite's own resolve plugin.

    if (!entryPoint) {
      for (const field of mainFields) {
        if (typeof pkg[field] === 'string') {
          entryPoint = pkg[field]
          break
        }
      }
    }

    // resolve object browser field in package.json
    // https://github.com/defunctzombie/package-browser-field-spec
    const browserField = pkg.browser
    if (entryPoint && browserField && typeof browserField === 'object') {
      entryPoint = mapWithBrowserField(entryPoint, browserField)
    }

    debug(`(node_module entry) ${id} -> ${entryPoint}`)

    // save resolved entry file path using the deep import path as key
    // e.g. foo/dist/foo.js
    // this is the path raw imports will be rewritten to, and is what will
    // be passed to resolveNodeModuleFile().
    let entryFilePath: string | null = null
    if (entryPoint) {
      // #284 some packages specify entry without extension...
      entryFilePath = path.join(path.dirname(pkgPath), entryPoint!)
      const ext = resolveExt(entryFilePath)
      if (ext) {
        entryPoint += ext
        entryFilePath += ext
      }
      entryPoint = path.posix.join(id, entryPoint!)
      // save the resolved file path now so we don't need to do it again in
      // resolveNodeModuleFile()
      nodeModulesFileMap.set(entryPoint, entryFilePath)
    }

    const result: NodeModuleInfo = {
      entry: entryPoint!,
      entryFilePath,
      pkg
    }
    nodeModulesInfoMap.set(cacheKey, result)
    return result
  }
}

export function resolveNodeModuleFile(
  root: string,
  id: string
): string | undefined {
  const cacheKey = `${root}#${id}`
  const cached = nodeModulesFileMap.get(cacheKey)
  if (cached) {
    return cached
  }
  try {
    const resolved = resolveFrom(root, id)
    nodeModulesFileMap.set(cacheKey, resolved)
    return resolved
  } catch (e) {
    // error will be reported downstream
  }
}

const normalize = path.posix.normalize

/**
 * given a relative path in pkg dir,
 * return a relative path in pkg dir,
 * mapped with the "map" object
 */
function mapWithBrowserField(
  relativePathInPkgDir: string,
  map: Record<string, string>
) {
  const normalized = normalize(relativePathInPkgDir)
  const foundEntry = Object.entries(map).find(([from]) => {
    return normalize(from) === normalized
  })
  if (!foundEntry) {
    return normalized
  }
  const [, to] = foundEntry
  return normalize(to)
}
