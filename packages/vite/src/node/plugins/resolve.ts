import fs from 'fs'
import path from 'path'
import { Plugin } from '../plugin'
import chalk from 'chalk'
import { FS_PREFIX, SUPPORTED_EXTS } from '../constants'
import {
  bareImportRE,
  createDebugger,
  deepImportRE,
  injectQuery,
  isExternalUrl,
  isObject,
  normalizePath,
  fsPathFromId,
  resolveFrom,
  isDataUrl
} from '../utils'
import { ResolvedConfig, ViteDevServer } from '..'
import slash from 'slash'
import { createFilter } from '@rollup/pluginutils'
import { PartialResolvedId } from 'rollup'
import isBuiltin from 'isbuiltin'
import { isCSSRequest } from './css'
import { resolve as _resolveExports } from 'resolve.exports'

const mainFields = ['module', 'main']

function resolveExports(
  pkg: PackageData['data'],
  key: string,
  isProduction: boolean
) {
  return _resolveExports(pkg, key, {
    browser: true,
    conditions: isProduction ? ['production'] : ['development']
  })
}

// special id for paths marked with browser: false
// https://github.com/defunctzombie/package-browser-field-spec#ignore-a-module
const browserExternalId = '__vite-browser-external'

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

interface ResolveOptions {
  root: string
  isBuild: boolean
  /**
   * src code mode also attempts the following:
   * - resolving /xxx as URLs
   * - resolving bare imports from optimized deps
   */
  asSrc: boolean
  dedupe?: string[]
}

export function resolvePlugin(
  { root, isBuild, asSrc, dedupe }: ResolveOptions,
  config?: ResolvedConfig
): Plugin {
  const isProduction = !!config?.isProduction
  let server: ViteDevServer | undefined

  return {
    name: 'vite:resolve',

    configureServer(_server) {
      server = _server
    },

    resolveId(id, importer, _, ssr) {
      if (id.startsWith(browserExternalId)) {
        return id
      }

      // fast path for commonjs proxy modules
      if (/\?commonjs/.test(id) || id === 'commonjsHelpers.js') {
        return
      }

      let res

      // explicit fs paths that starts with /@fs/*
      if (asSrc && id.startsWith(FS_PREFIX)) {
        const fsPath = fsPathFromId(id)
        res = tryFsResolve(fsPath, false)
        isDebug && debug(`[@fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return res || fsPath
      }

      // URL
      // /foo -> /fs-root/foo
      if (asSrc && id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath, isProduction))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // relative
      if (id.startsWith('.')) {
        const basedir = importer ? path.dirname(importer) : process.cwd()
        let fsPath = path.resolve(basedir, id)
        // handle browser field mapping for relative imports

        if (
          (res = tryResolveBrowserMapping(fsPath, importer, true, isProduction))
        ) {
          return res
        }

        if ((res = tryFsResolve(fsPath, isProduction))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          const pkg = idToPkgMap.get(id)
          if (pkg) {
            idToPkgMap.set(res, pkg)
            return {
              id: res,
              moduleSideEffects: pkg.hasSideEffects(res)
            }
          }
          return res
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id, isProduction))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return res
      }

      // external
      if (isExternalUrl(id)) {
        return {
          id,
          external: true
        }
      }

      // data uri: pass through (this only happens during build and will be
      // handled by dedicated plugin)
      if (isDataUrl(id)) {
        return null
      }

      // bare package imports, perform node resolve
      if (bareImportRE.test(id)) {
        if (asSrc && server && (res = tryOptimizedResolve(id, server))) {
          return res
        }

        if (
          (res = tryResolveBrowserMapping(id, importer, false, isProduction))
        ) {
          return res
        }

        if (
          (res = tryNodeResolve(
            id,
            importer ? path.dirname(importer) : root,
            isProduction,
            isBuild,
            dedupe,
            root,
            server
          ))
        ) {
          return res
        }

        // node built-ins.
        // externalize if building for SSR, otherwise redirect to empty module
        if (isBuiltin(id)) {
          if (ssr) {
            return {
              id,
              external: true
            }
          } else {
            if (!asSrc) {
              this.warn(
                `externalized node built-in "${id}" to empty module. ` +
                  `(imported by: ${chalk.white.dim(importer)})`
              )
            }
            return isProduction
              ? browserExternalId
              : `${browserExternalId}:${id}`
          }
        }
      }

      isDebug && debug(`[fallthrough] ${chalk.dim(id)}`)
    },

    load(id) {
      if (id.startsWith(browserExternalId)) {
        return isProduction
          ? `export default {}`
          : `export default new Proxy({}, {
  get() {
    throw new Error('Module "${id.slice(
      browserExternalId.length + 1
    )}" has been externalized for browser compatibility and cannot be accessed in client code.')
  }
})`
      }
    }
  }
}

function tryFsResolve(
  fsPath: string,
  isProduction: boolean,
  tryIndex = true
): string | undefined {
  const [file, q] = fsPath.split(`?`, 2)
  const query = q ? `?${q}` : ``
  let res: string | undefined
  if ((res = tryResolveFile(file, query, isProduction, tryIndex))) {
    return res
  }
  for (const ext of SUPPORTED_EXTS) {
    if ((res = tryResolveFile(file + ext, query, isProduction, tryIndex))) {
      return res
    }
  }
}

function tryResolveFile(
  file: string,
  query: string,
  isProduction: boolean,
  tryIndex: boolean
): string | undefined {
  if (fs.existsSync(file)) {
    const isDir = fs.statSync(file).isDirectory()
    if (isDir) {
      if (tryIndex) {
        const index = tryFsResolve(file + '/index', isProduction, false)
        if (index) return normalizePath(index) + query
      }
      const pkgPath = file + '/package.json'
      if (fs.existsSync(pkgPath)) {
        // path points to a node package
        const pkg = loadPackageData(pkgPath)
        return resolvePackageEntry(file, pkg, isProduction)
      }
    } else {
      return normalizePath(file) + query
    }
  }
}

export const idToPkgMap = new Map<string, PackageData>()

export function tryNodeResolve(
  id: string,
  basedir: string,
  isProduction: boolean,
  isBuild = true,
  dedupe?: string[],
  dedupeRoot?: string,
  server?: ViteDevServer
): PartialResolvedId | undefined {
  const deepMatch = id.match(deepImportRE)
  const pkgId = deepMatch ? deepMatch[1] || deepMatch[2] : id

  if (dedupe && dedupeRoot && dedupe.includes(pkgId)) {
    basedir = dedupeRoot
  }

  const pkg = resolvePackageData(pkgId, basedir)

  if (!pkg) {
    return
  }

  // prevent deep imports to optimized deps.
  if (
    deepMatch &&
    server &&
    server._optimizeDepsMetadata &&
    pkg.data.name in server._optimizeDepsMetadata.map &&
    !isCSSRequest(id) &&
    !server.config.assetsInclude(id)
  ) {
    throw new Error(
      chalk.yellow(
        `Deep import "${chalk.cyan(
          id
        )}" should be avoided because dependency "${chalk.cyan(
          pkg.data.name
        )}" has been pre-optimized. Prefer importing directly from the module entry:\n\n` +
          `${chalk.green(`import { ... } from "${pkg.data.name}"`)}\n\n` +
          `If the used import is not exported from the package's main entry ` +
          `and can only be attained via deep import, you can explicitly add ` +
          `the deep import path to "optimizeDeps.include" in vite.config.js.`
      )
    )
  }

  let resolved = deepMatch
    ? resolveDeepImport(id, pkg, isProduction)
    : resolvePackageEntry(id, pkg, isProduction)
  if (!resolved) {
    return
  }
  // link id to pkg for browser field mapping check
  idToPkgMap.set(resolved, pkg)
  if (isBuild) {
    // Resolve package side effects for build so that rollup can better
    // perform tree-shaking
    return {
      id: resolved,
      moduleSideEffects: pkg.hasSideEffects(resolved)
    }
  } else {
    // During serve, inject a version query to npm deps so that the browser
    // can cache it without revalidation. Make sure to apply this only to
    // files actually inside node_modules so that locally linked packages
    // in monorepos are not cached this way.
    if (resolved.includes('node_modules')) {
      const versionHash = server?._optimizeDepsMetadata?.hash
      if (versionHash) {
        resolved = injectQuery(resolved, `v=${versionHash}`)
      }
    }
    return { id: resolved }
  }
}

export function tryOptimizedResolve(
  rawId: string,
  server: ViteDevServer
): string | undefined {
  const cacheDir = server.config.optimizeCacheDir
  const depData = server._optimizeDepsMetadata
  if (cacheDir && depData) {
    const [id, q] = rawId.split(`?`, 2)
    const query = q ? `?${q}` : ``
    const filePath = depData.map[id]
    if (filePath) {
      return normalizePath(path.resolve(cacheDir, filePath)) + query
    }
  }
}

export interface PackageData {
  dir: string
  hasSideEffects: (id: string) => boolean
  resolvedImports: Record<string, string | undefined>
  data: {
    [field: string]: any
    version: string
    main: string
    module: string
    browser: string | Record<string, string | false>
    exports: string | Record<string, any> | string[]
    dependencies: Record<string, string>
  }
}

const packageCache = new Map<string, PackageData>()

export function resolvePackageData(
  id: string,
  basedir: string
): PackageData | undefined {
  const cacheKey = id + basedir
  if (packageCache.has(cacheKey)) {
    return packageCache.get(cacheKey)
  }
  try {
    const pkgPath = resolveFrom(`${id}/package.json`, basedir)
    return loadPackageData(pkgPath, cacheKey)
  } catch (e) {
    isDebug && debug(`${chalk.red(`[failed loading package.json]`)} ${id}`)
  }
}

function loadPackageData(pkgPath: string, cacheKey = pkgPath) {
  const data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const pkgDir = path.dirname(pkgPath)
  const { sideEffects } = data
  let hasSideEffects
  if (typeof sideEffects === 'boolean') {
    hasSideEffects = () => sideEffects
  } else if (Array.isArray(sideEffects)) {
    hasSideEffects = createFilter(sideEffects, null, { resolve: pkgDir })
  } else {
    hasSideEffects = () => true
  }

  const pkg = {
    dir: pkgDir,
    data,
    hasSideEffects,
    resolvedImports: {}
  }
  packageCache.set(cacheKey, pkg)
  return pkg
}

export function resolvePackageEntry(
  id: string,
  { resolvedImports, dir, data }: PackageData,
  isProduction = false
): string | undefined {
  if (resolvedImports['.']) {
    return resolvedImports['.']
  }

  let entryPoint: string | undefined | void

  // resolve exports field with highest priority
  // using https://github.com/lukeed/resolve.exports
  if (data.exports) {
    entryPoint = resolveExports(data, '.', isProduction)
  }

  if (!entryPoint) {
    // check browser field
    // https://github.com/defunctzombie/package-browser-field-spec
    const browserEntry =
      typeof data.browser === 'string'
        ? data.browser
        : isObject(data.browser) && data.browser['.']
    if (browserEntry) {
      // check if the package also has a "module" field.
      if (typeof data.module === 'string' && data.module !== browserEntry) {
        // if both are present, we may have a problem: some package points both
        // to ESM, with "module" targeting Node.js, while some packages points
        // "module" to browser ESM and "browser" to UMD.
        // the heuristics here is to actually read the browser entry when
        // possible and check for hints of UMD. If it is UMD, prefer "module"
        // instead; Otherwise, assume it's ESM and use it.
        const resolvedBrowserEntry = tryFsResolve(
          path.resolve(dir, browserEntry),
          isProduction
        )
        if (resolvedBrowserEntry) {
          const content = fs.readFileSync(resolvedBrowserEntry, 'utf-8')
          if (
            (/typeof exports\s*==/.test(content) &&
              /typeof module\s*==/.test(content)) ||
            /module\.exports\s*=/.test(content)
          ) {
            // likely UMD or CJS(!!! e.g. firebase 7.x), prefer module
            entryPoint = data.module
          }
        }
      } else {
        entryPoint = browserEntry
      }
    }
  }

  if (!entryPoint) {
    for (const field of mainFields) {
      if (typeof data[field] === 'string') {
        entryPoint = data[field]
        break
      }
    }
  }

  entryPoint = entryPoint || 'index.js'

  // resolve object browser field in package.json
  const { browser: browserField } = data
  if (isObject(browserField)) {
    entryPoint = mapWithBrowserField(entryPoint, browserField) || entryPoint
  }

  entryPoint = path.resolve(dir, entryPoint)
  const resolvedEntryPont = tryFsResolve(entryPoint, isProduction)

  if (resolvedEntryPont) {
    isDebug &&
      debug(
        `[package entry] ${chalk.cyan(id)} -> ${chalk.dim(resolvedEntryPont)}`
      )
    resolvedImports['.'] = resolvedEntryPont
    return resolvedEntryPont
  } else {
    throw new Error(
      `Failed to resolve entry for package "${id}". ` +
        `The package may have incorrect main/module/exports specified in its package.json.`
    )
  }
}

function resolveDeepImport(
  id: string,
  { resolvedImports, dir, data }: PackageData,
  isProduction: boolean
): string | undefined {
  id = '.' + id.slice(data.name.length)
  if (resolvedImports[id]) {
    return resolvedImports[id]
  }

  let relativeId: string | undefined | void = id
  const { exports: exportsField, browser: browserField } = data

  // map relative based on exports data
  if (exportsField) {
    if (isObject(exportsField) && !Array.isArray(exportsField)) {
      relativeId = resolveExports(data, relativeId, isProduction)
    } else {
      // not exposed
      relativeId = undefined
    }
    if (!relativeId) {
      throw new Error(
        `Package subpath '${relativeId}' is not defined by "exports" in ` +
          `${path.join(dir, 'package.json')}.`
      )
    }
  } else if (isObject(browserField)) {
    const mapped = mapWithBrowserField(relativeId, browserField)
    if (mapped) {
      relativeId = mapped
    } else {
      return (resolvedImports[id] = browserExternalId)
    }
  }

  if (relativeId) {
    const resolved = tryFsResolve(path.resolve(dir, relativeId), !exportsField)
    if (resolved) {
      isDebug &&
        debug(`[node/deep-import] ${chalk.cyan(id)} -> ${chalk.dim(resolved)}`)
      return (resolvedImports[id] = resolved)
    }
  }
}

function tryResolveBrowserMapping(
  id: string,
  importer: string | undefined,
  isFilePath: boolean,
  isProduction: boolean
) {
  let res: string | undefined
  const pkg = importer && idToPkgMap.get(importer)
  if (pkg && isObject(pkg.data.browser)) {
    const mapId = isFilePath ? './' + slash(path.relative(pkg.dir, id)) : id
    const browserMappedPath = mapWithBrowserField(mapId, pkg.data.browser)
    if (browserMappedPath) {
      const fsPath = path.resolve(pkg.dir, browserMappedPath)
      if ((res = tryFsResolve(fsPath, isProduction))) {
        isDebug &&
          debug(`[browser mapped] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        idToPkgMap.set(res, pkg)
        return {
          id: res,
          moduleSideEffects: pkg.hasSideEffects(res)
        }
      }
    } else {
      return browserExternalId
    }
  }
}

/**
 * given a relative path in pkg dir,
 * return a relative path in pkg dir,
 * mapped with the "map" object
 */
function mapWithBrowserField(
  relativePathInPkgDir: string,
  map: Record<string, string | false>
) {
  const normalized = normalize(relativePathInPkgDir)
  const foundEntry = Object.entries(map).find(
    ([from]) => normalize(from) === normalized
  )
  if (!foundEntry) {
    return relativePathInPkgDir
  }
  return foundEntry[1]
}

function normalize(file: string) {
  return path.posix.normalize(path.extname(file) ? file : file + '.js')
}
