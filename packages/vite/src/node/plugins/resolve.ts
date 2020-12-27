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
  isDataUrl,
  isExternalUrl,
  isObject,
  normalizePath,
  resolveFrom
} from '../utils'
import { ViteDevServer } from '..'
import slash from 'slash'

const mainFields = ['module', 'jsnext', 'jsnext:main', 'browser', 'main']

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin(
  root: string,
  isBuild: boolean,
  /**
   * src code mode also attempts the following:
   * - resolving /xxx as URLs
   * - resolving bare imports from optimized deps
   */
  asSrc: boolean
): Plugin {
  let server: ViteDevServer

  return {
    name: 'vite:resolve',

    configureServer(_server) {
      server = _server
    },

    resolveId(id, importer) {
      let res
      if (asSrc && id.startsWith(FS_PREFIX)) {
        // explicit fs paths that starts with /@fs/*
        // these are injected by the rewrite plugin so that the file can work
        // in the browser
        let fsPath = id.slice(FS_PREFIX.length - 1)
        if (fsPath.startsWith('//')) fsPath = fsPath.slice(1)
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
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        let fsPath = path.resolve(path.dirname(importer), id)
        // handle browser field mapping for relative imports
        const pkg = idToPkgMap.get(importer)
        if (pkg && pkg.data.browser) {
          const pkgRealtivePath = './' + slash(path.relative(pkg.dir, fsPath))
          fsPath = path.resolve(
            pkg.dir,
            mapWithBrowserField(pkgRealtivePath, pkg.data.browser)
          )
        }
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          if (pkg) {
            idToPkgMap.set(res, pkg)
          }
          return res
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return res
      }

      // external
      if (isExternalUrl(id) || isDataUrl(id)) {
        return {
          id,
          external: true
        }
      }

      // bare package imports, perform node resolve
      if (bareImportRE.test(id)) {
        if (asSrc && server && (res = tryOptimizedResolve(id, server))) {
          return res
        }

        if (
          (res = tryNodeResolve(
            id,
            importer ? path.dirname(importer) : root,
            isBuild,
            server
          ))
        ) {
          return res
        }
      }

      isDebug && debug(`[fallthrough] ${chalk.dim(id)}`)
      return this.resolve(id, importer, { skipSelf: true })
    }
  }
}

function tryFsResolve(fsPath: string, tryIndex = true): string | undefined {
  const [file, q] = fsPath.split(`?`, 2)
  const query = q ? `?${q}` : ``
  let res: string | undefined
  if ((res = tryResolveFile(file, query, tryIndex))) {
    return res
  }
  for (const ext of SUPPORTED_EXTS) {
    if ((res = tryResolveFile(file + ext, query, tryIndex))) {
      return res
    }
  }
}

function tryResolveFile(
  file: string,
  query: string,
  tryIndex: boolean
): string | undefined {
  if (fs.existsSync(file)) {
    const isDir = fs.statSync(file).isDirectory()
    if (isDir) {
      if (tryIndex) {
        const index = tryFsResolve(file + '/index', false)
        if (index) return normalizePath(index) + query
      }
    } else {
      return normalizePath(file) + query
    }
  }
}

const idToPkgMap = new Map<string, PackageData>()

export function tryNodeResolve(
  id: string,
  basedir: string,
  isBuild = true,
  server?: ViteDevServer
): string | undefined {
  const deepMatch = id.match(deepImportRE)
  const pkgId = deepMatch ? deepMatch[1] || deepMatch[2] : id
  const pkg = resolvePackageData(pkgId, basedir)

  if (pkg) {
    // prevent deep imports to optimized deps.
    if (
      deepMatch &&
      server &&
      server.optimizeDepsMetadata &&
      pkg.data.name in server.optimizeDepsMetadata.map
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

    const resolved = deepMatch
      ? resolveDeepImport(id, pkg)
      : resolvePackageEntry(id, pkg)
    if (resolved) {
      idToPkgMap.set(resolved, pkg)
    }
    if (isBuild) {
      return resolved
    } else {
      // During serve, inject a version query to npm deps so that the browser
      // can cache it without revalidation. Make sure to apply this only to
      // files actually inside node_modules so that locally linked packages
      // in monorepos are not cached this way.
      if (resolved && resolved.includes('node_modules')) {
        return injectQuery(resolved, `v=${pkg.data.version}`)
      } else {
        return resolved
      }
    }
  } else {
    throw new Error(`Failed to resolve package.json for module "${id}"`)
  }
}

function tryOptimizedResolve(
  rawId: string,
  server: ViteDevServer
): string | undefined {
  const cacheDir = server.config.optimizeCacheDir
  const depData = server.optimizeDepsMetadata
  if (cacheDir && depData) {
    const [id, q] = rawId.split(`?`, 2)
    const query = q ? `?${q}` : ``
    const filePath = depData.map[id]
    if (filePath) {
      return normalizePath(path.resolve(cacheDir, filePath)) + query
    }
  }
}

interface PackageData {
  dir: string
  data: {
    [field: string]: any
    version: string
    exports: string | Record<string, any> | string[]
    dependencies: Record<string, string>
  }
}

const packageCache = new Map<string, PackageData>()

function resolvePackageData(
  id: string,
  basedir: string
): PackageData | undefined {
  const cacheKey = id + basedir
  if (packageCache.has(cacheKey)) {
    return packageCache.get(cacheKey)
  }
  let data
  try {
    const pkgPath = resolveFrom(`${id}/package.json`, basedir)
    data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const pkg = {
      dir: path.dirname(pkgPath),
      data
    }
    packageCache.set(cacheKey, pkg)
    return pkg
  } catch (e) {
    isDebug && debug(`${chalk.red(`[failed loading package.json]`)} ${id}`)
  }
}

export function resolvePackageEntry(
  id: string,
  { dir, data }: PackageData
): string | undefined {
  let entryPoint: string | undefined

  // resolve exports field
  // https://nodejs.org/api/packages.html#packages_package_entry_points
  const { exports: exportsField } = data
  if (exportsField) {
    if (typeof exportsField === 'string') {
      entryPoint = exportsField
    } else if (Array.isArray(exportsField)) {
      entryPoint = exportsField[0]
    } else if (isObject(exportsField)) {
      if ('.' in exportsField) {
        entryPoint = resolveConditionalExports(exportsField['.'])
      } else {
        entryPoint = resolveConditionalExports(exportsField)
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
  // https://github.com/defunctzombie/package-browser-field-spec
  const { browser: browserField } = data
  if (browserField && typeof browserField === 'object') {
    entryPoint = mapWithBrowserField(entryPoint, browserField)
  }

  entryPoint = path.resolve(dir, entryPoint)
  const resolvedEntryPont = tryFsResolve(entryPoint)

  if (resolvedEntryPont) {
    isDebug &&
      debug(
        `[package entry] ${chalk.cyan(id)} -> ${chalk.dim(resolvedEntryPont)}`
      )
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
  { dir, data }: PackageData
): string | undefined {
  let relativeId: string | undefined = '.' + id.slice(data.name.length)
  const { exports: exportsField, browser: browserField } = data

  // map relative based on exports data
  if (exportsField) {
    if (
      isObject(exportsField) &&
      !Array.isArray(exportsField) &&
      relativeId in exportsField
    ) {
      relativeId = resolveConditionalExports(exportsField[relativeId])
    } else {
      throw new Error(
        `Package subpath '${relativeId}' is not defined by "exports" in ` +
          `${path.join(dir, 'package.json')}.`
      )
    }
  } else if (browserField) {
    relativeId = mapWithBrowserField(relativeId, browserField)
  }

  if (relativeId) {
    const resolved = tryFsResolve(path.resolve(dir, relativeId), !exportsField)
    if (resolved) {
      isDebug &&
        debug(`[node/deep-import] ${chalk.cyan(id)} -> ${chalk.dim(resolved)}`)
      return resolved
    }
  }
}

function resolveConditionalExports(exp: any): string | undefined {
  if (typeof exp === 'string') {
    return exp
  } else if (isObject(exp)) {
    if (typeof exp.import === 'string') {
      return exp.import
    } else if (typeof exp.default === 'string') {
      return exp.default
    }
  } else if (Array.isArray(exp)) {
    for (let i = 0; i < exp.length; i++) {
      const res = resolveConditionalExports(exp[i])
      if (res) return res
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
  map: Record<string, string>
) {
  const normalized = normalize(relativePathInPkgDir)
  const foundEntry = Object.entries(map).find(
    ([from]) => normalize(from) === normalized
  )
  if (!foundEntry) {
    return normalized
  }
  return normalize(foundEntry[1])
}

function normalize(file: string) {
  return path.posix.normalize(path.extname(file) ? file : file + '.js')
}
