import fs from 'fs-extra'
import path from 'path'
import url from 'url'
import querystring from 'querystring'
import slash from 'slash'
import {
  cleanUrl,
  resolveFrom,
  queryRE,
  lookupFile,
  parseNodeModuleId
} from './utils'
import { moduleRE, moduleIdToFileMap } from './server/serverPluginModuleResolve'
import { resolveOptimizedCacheDir } from './optimizer'
import { clientPublicPath } from './server/serverPluginClient'
import { isCSSRequest } from './utils/cssUtils'
import {
  addStringQuery,
  encodeQuery,
  isStaticAsset,
  mapQuery,
  parseWithQuery
} from './utils/pathUtils'
import chalk from 'chalk'

const debug = require('debug')('vite:resolve')
const isWin = require('os').platform() === 'win32'
const pathSeparator = isWin ? '\\' : '/'

export interface Resolver {
  requestToFile?(publicPath: string, root: string): string | undefined
  fileToRequest?(filePath: string, root: string): string | undefined
  alias?: ((id: string) => string | undefined) | Record<string, string>
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
  normalizePublicPath(publicPath: string): string
  alias(id: string): string | undefined
  resolveRelativeRequest(publicPath: string, relativePublicPath: string): string
  isPublicRequest(publicPath: string): boolean
  isAssetRequest(filePath: string): boolean
}

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
export const mainFields = ['module', 'jsnext', 'jsnext:main', 'browser', 'main']

const defaultRequestToFile = (publicPath: string, root: string): string => {
  const search = publicPath.match(queryRE)?.[0]
  const query = querystring.parse(search ? search.slice(1) : '')
  const { realPath = '' } = query
  if (realPath) {
    return path.resolve(
      cleanUrl(Array.isArray(realPath) ? realPath[0] : realPath)
    )
  } else {
    if (moduleRE.test(publicPath)) {
      console.log(
        Error(
          `cannot resolve node module file '${publicPath}' without realPath`
        )
      )
    }
  }

  if (moduleRE.test(publicPath)) {
    const id = publicPath.replace(moduleRE, '')
    // const cachedNodeModule = moduleIdToFileMap.get(id)
    // if (cachedNodeModule) {
    //   return cachedNodeModule
    // }
    // try to resolve from optimized modules
    const optimizedModule = resolveOptimizedModule(root, id)
    if (optimizedModule) {
      return optimizedModule
    }
    // try to resolve from normal node_modules

    // console.log(`requestToFile resolving from context ${context}`)
    const nodeModule = resolveNodeModuleFile(
      root,
      cleanUrl(publicPath).replace(moduleRE, '')
    )

    if (nodeModule) {
      moduleIdToFileMap.set(id, nodeModule) // TODO moduleIdToFileMap should use also root for cache key, module with same ids could be different
      return nodeModule
    }
  }
  const publicDirPath = path.join(root, 'public', publicPath.slice(1))
  if (fs.existsSync(publicDirPath)) {
    return publicDirPath
  }

  return path.join(root, cleanUrl(publicPath).slice(1))
}

// TODO defaultFileToRequest uses cache to return correct paths for node_modules
const defaultFileToRequest = (filePath: string, root: string): string => {
  // const cached = moduleFileToIdMap.get(filePath)
  // if (cached) {
  //   console.log(`defaultFileToRequest using cached '${cached}' for ${filePath}`)
  //   return cached
  // }
  const realPath = path.resolve(cleanUrl(filePath))
  if (!realPath) {
    console.error(Error(`no realPath for ${filePath}`))
  }
  const relative = path.relative(root, filePath)
  const res = mapQuery('/' + slash(relative).replace(/^public\//, ''), (q) => {
    return {
      ...q,
      realPath
    }
  })
  return res
}

const isFile = (file: string): boolean => {
  try {
    return fs.statSync(file).isFile()
  } catch (e) {
    return false
  }
}

/**
 * this function resolve fuzzy file path. examples:
 * /path/file is a fuzzy file path for /path/file.tsx
 * /path/dir is a fuzzy file path for /path/dir/index.js
 *
 * returning undefined indicates the filePath is not fuzzy:
 * it is already an exact file path, or it can't match any file
 */
const resolveFilePathPostfix = (filePath: string): string | undefined => {
  const cleanPath = cleanUrl(filePath)
  if (!isFile(cleanPath)) {
    let postfix = ''
    for (const ext of supportedExts) {
      if (isFile(cleanPath + ext)) {
        postfix = ext
        break
      }
      const defaultFilePath = `/index${ext}`
      if (isFile(path.join(cleanPath, defaultFilePath))) {
        postfix = defaultFilePath
        break
      }
    }
    const queryMatch = filePath.match(/\?.*$/)
    const query = queryMatch ? queryMatch[0] : ''
    const resolved = cleanPath + postfix + query
    if (resolved !== filePath) {
      debug(`(postfix) ${filePath} -> ${resolved}`)
      return postfix
    }
  }
}

const isDir = (p: string) => {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

export function createResolver(
  root: string,
  resolvers: Resolver[] = [],
  userAlias: Record<string, string> = {},
  assetsInclude?: (file: string) => boolean
): InternalResolver {
  resolvers = [...resolvers]
  const literalAlias: Record<string, string> = {}
  const literalDirAlias: Record<string, string> = {}

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
            if (filePath.startsWith(target + pathSeparator)) {
              return slash(key + path.relative(target, filePath))
            }
          }
        })
        literalDirAlias[key] = target
      } else {
        literalAlias[key] = target
      }
    }
  }

  resolvers.forEach(({ alias }) => {
    if (alias && typeof alias === 'object') {
      resolveAlias(alias)
    }
  })
  resolveAlias(userAlias)

  const requestToFileCache = new Map<string, string>()
  const fileToRequestCache = new Map<string, string>()

  const resolver: InternalResolver = {
    requestToFile(publicPath) {
      publicPath = decodeURIComponent(publicPath)
      if (requestToFileCache.has(publicPath)) {
        return requestToFileCache.get(publicPath)!
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
      const postfix = resolveFilePathPostfix(resolved)
      if (postfix) {
        if (postfix[0] === '/') {
          resolved = path.join(resolved, postfix)
        } else {
          resolved += postfix
        }
      }
      requestToFileCache.set(publicPath, resolved)
      return resolved
    },

    fileToRequest(filePath) {
      if (fileToRequestCache.has(filePath)) {
        return fileToRequestCache.get(filePath)!
      }
      for (const r of resolvers) {
        const request = r.fileToRequest && r.fileToRequest(filePath, root)
        if (request) return request
      }
      const res = defaultFileToRequest(filePath, root)
      fileToRequestCache.set(filePath, res)
      return res // TODO add the context here, can a node_module be resolved from its own directory?
    },

    /**
     * Given a fuzzy public path, resolve missing extensions and /index.xxx
     */
    normalizePublicPath(publicPath) {
      if (publicPath === clientPublicPath) {
        return publicPath
      }
      // preserve query
      // const queryMatch = publicPath.match(/\?.*$/)
      // const query = queryMatch ? queryMatch[0] : ''
      const cleanPublicPath = cleanUrl(publicPath)

      const finalize = (result: string) => {
        // result += query
        if (!result.includes('realPath')) {
          console.error(new Error(`no realPath in ${result}`))
        }
        if (
          resolver.requestToFile(result) !== resolver.requestToFile(publicPath)
        ) {
          // TODO readd the error
          throw new Error(
            `ERROR [vite] normalizePublicPath check fail. please report to vite.\n${result}\n${publicPath}\n${resolver.requestToFile(
              result
            )}\n${resolver.requestToFile(publicPath)}`
          )
        }
        return result
      }

      if (!moduleRE.test(cleanPublicPath)) {
        let res = resolver.fileToRequest(resolver.requestToFile(publicPath))
        res = mapQuery(res, (q) => {
          const queryMatch = publicPath.match(queryRE)?.[0]
          return {
            ...(queryMatch && querystring.parse(queryMatch.slice(1))),
            ...q
          }
        })
        return finalize(res)
      }

      const filePath = resolver.requestToFile(publicPath)
      // const cacheDir = resolveOptimizedCacheDir(root)
      // if (cacheDir) {
      //   const relative = path.relative(cacheDir, filePath)
      //   if (!relative.startsWith('..')) {
      //     return finalize(path.posix.join('/@modules/', slash(relative)))
      //   }
      // }

      // fileToRequest doesn't work with files in node_modules
      // because of edge cases like symlinks or yarn-aliased-install
      // or even aliased-symlinks

      // example id: "@babel/runtime/helpers/esm/slicedToArray"
      // see the test case: /playground/TestNormalizePublicPath.vue
      const id = cleanPublicPath.replace(moduleRE, '')
      const { scope, name, inPkgPath } = parseNodeModuleId(id)
      if (!inPkgPath) return publicPath
      let filePathPostFix = ''
      let findPkgFrom = filePath
      while (!filePathPostFix.startsWith(inPkgPath)) {
        // some package contains multi package.json...
        // for example: @babel/runtime@7.10.2/helpers/esm/package.json
        const pkgPath = lookupFile(findPkgFrom, ['package.json'], true)
        if (!pkgPath) {
          throw new Error(
            `[vite] can't find package.json for a node_module file: ` +
              `"${publicPath}". something is wrong.`
          )
        }
        filePathPostFix = slash(path.relative(path.dirname(pkgPath), filePath))
        findPkgFrom = path.join(path.dirname(pkgPath), '../')
      }

      return finalize(
        ['/@modules', scope, name, filePathPostFix].filter(Boolean).join('/') +
          (url.parse(publicPath).search || '')
        // readd the original query string
      )
    },

    alias(id) {
      const { path, query } = parseWithQuery(id)
      let aliased: string | undefined = literalAlias[path]
      if (aliased) {
        return mapQuery(aliased, (q) => ({ ...query, ...q }))
      }
      for (const { alias } of resolvers) {
        aliased = alias && typeof alias === 'function' ? alias(path) : undefined
        if (aliased) {
          return mapQuery(aliased, (q) => ({ ...query, ...q }))
        }
      }
    },

    resolveRelativeRequest(importer: string, importee: string) {
      const queryMatch = importee.match(queryRE)
      importee = cleanUrl(importee)
      let resolved = importee
      const importerFilePath = resolver.requestToFile(importer)
      let realPath = ''

      if (importee.startsWith('.')) {
        resolved = path.posix.resolve(path.posix.dirname(importer), importee)
        realPath = path.resolve(path.dirname(importerFilePath), importee)
        for (const alias in literalDirAlias) {
          if (importer.startsWith(alias)) {
            if (!resolved.startsWith(alias)) {
              // resolved path is outside of alias directory, we need to use
              // its full path instead
              resolved = resolver.fileToRequest(realPath)
            }
            break
          }
        }
      }
      if (!realPath) {
        console.error(
          new Error(`no realPath for ${importee} imported from ${importer}`)
        )
      }

      const query = encodeQuery({
        ...querystring.parse(queryMatch ? queryMatch[0].slice(1) : ''),
        ...(realPath && { realPath }) // TODO this path could not exist, maybe remove it if file does not exist?
      })

      const pathname =
        cleanUrl(resolved) +
        // path resolve strips ending / which should be preserved
        (importee.endsWith('/') && !resolved.endsWith('/') ? '/' : '')
      return `${pathname}${query ? '?' + query : ''}`
    },

    isPublicRequest(publicPath: string) {
      return resolver
        .requestToFile(publicPath)
        .startsWith(path.resolve(root, 'public'))
    },

    isAssetRequest(filePath: string) {
      return (
        (assetsInclude && assetsInclude(filePath)) || isStaticAsset(filePath)
      )
    }
  }

  return resolver
}

export const jsSrcRE = /\.(?:(?:j|t)sx?|vue)$|\.mjs$/
const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

/**
 * Redirects a bare module request to a full path under /@modules/
 * It resolves a bare node module id to its full entry path so that relative
 * imports from the entry can be correctly resolved.
 * e.g.:
 * - `import 'foo'` -> `import '/@modules/foo/dist/index.js'`
 * - `import 'foo/bar/baz'` -> `import '/@modules/foo/bar/baz.js'`
 */
export function resolveBareModuleRequest(
  root: string,
  publicPath: string,
  importer: string,
  resolver: InternalResolver
): string {
  let id = cleanUrl(publicPath).replace(moduleRE, '')
  let realPath: string | undefined
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
  const pkgInfo = resolveNodeModule(basedir, id, resolver)
  if (pkgInfo) {
    if (!pkgInfo.entry) {
      console.error(
        chalk.yellow(
          `[vite] dependency ${id} does not have default entry defined in package.json.`
        )
      )
    } else {
      isEntry = true
      id = pkgInfo.entry
      realPath = pkgInfo.entryFilePath
    }
  }

  if (!isEntry) {
    const deepMatch = !isEntry && id.match(deepImportRE)
    if (deepMatch) {
      // deep import
      const depId = deepMatch[1] || deepMatch[2]

      // check if this is a deep import to an optimized dep.
      if (resolveOptimizedModule(root, depId)) {
        if (resolver.alias(depId) === id) {
          // this is a deep import but aliased from a bare module id.
          // redirect it the optimized copy.
          return resolveBareModuleRequest(
            root,
            addStringQuery(depId, publicPath.match(queryRE)?.[0]),
            importer,
            resolver
          ) // TODO THIS loses query
        }
        if (!isCSSRequest(id) && !resolver.isAssetRequest(id)) {
          // warn against deep imports to optimized dep
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

      // resolve ext for deepImport
      realPath = resolveNodeModuleFile(basedir, id)
      if (realPath) {
        const deepPath = id.replace(deepImportRE, '')
        const normalizedFilePath = slash(realPath)
        const postfix = normalizedFilePath.slice(
          normalizedFilePath.lastIndexOf(deepPath) + deepPath.length
        )
        id += postfix
      }
    }
  }

  // check and warn deep imports on optimized modules

  if (!realPath) {
    console.error(new Error(`no realPath for ${id}`))
  }

  return mapQuery(id, () => {
    const ext = path.extname(cleanUrl(id))
    const { query } = parseWithQuery(publicPath)
    return {
      ...query,
      ...(!jsSrcRE.test(ext) && { import: '' }),
      ...(realPath && { realPath })
    }
  })
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

  const tryResolve = (file: string) => {
    file = path.join(cacheDir, file)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      viteOptimizedMap.set(cacheKey, file)
      return file
    }
  }

  return tryResolve(id) || tryResolve(id + '.js')
}

interface NodeModuleInfo {
  entry: string | undefined
  entryFilePath: string | undefined
  pkg: any
}
const nodeModulesInfoMap = new Map<string, NodeModuleInfo>()
const nodeModulesFileMap = new Map()

export function resolveNodeModule(
  root: string,
  id: string,
  resolver: InternalResolver
): NodeModuleInfo | undefined {
  const cacheKey = `${root}#${id}`
  const cached = nodeModulesInfoMap.get(cacheKey)
  if (cached) {
    return cached
  }
  let pkgPath
  id = cleanUrl(id)
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
    let entryPoint: string | undefined

    // TODO properly support conditional exports
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

    if (!entryPoint) {
      entryPoint = 'index.js'
    }

    // resolve object browser field in package.json
    // https://github.com/defunctzombie/package-browser-field-spec
    const { browser: browserField } = pkg
    if (entryPoint && browserField && typeof browserField === 'object') {
      entryPoint = mapWithBrowserField(entryPoint, browserField)
    }

    debug(`(node_module entry) ${id} -> ${entryPoint}`)

    // save resolved entry file path using the deep import path as key
    // e.g. foo/dist/foo.js
    // this is the path raw imports will be rewritten to, and is what will
    // be passed to resolveNodeModuleFile().
    let entryFilePath: string | undefined

    // respect user manual alias
    const aliased = resolver.alias(id)
    if (aliased && aliased !== id) {
      entryFilePath = resolveNodeModuleFile(root, aliased)
    }

    if (!entryFilePath && entryPoint) {
      // #284 some packages specify entry without extension...
      entryFilePath = path.join(path.dirname(pkgPath), entryPoint!)
      const postfix = resolveFilePathPostfix(entryFilePath)
      if (postfix) {
        entryPoint += postfix
        entryFilePath += postfix
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
    const resolved = resolveFrom(root, cleanUrl(id))
    nodeModulesFileMap.set(cacheKey, resolved)
    return resolved
  } catch (e) {
    // console.error(
    //   new Error(
    //     `could not resolve module '${id}' from '${path.relative(
    //       process.cwd(),
    //       root
    //     )}'`
    //   )
    // )
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
  const foundEntry = Object.entries(map).find(
    ([from]) => normalize(from) === normalized
  )
  if (!foundEntry) {
    return normalized
  }
  const [, to] = foundEntry
  return normalize(to)
}
