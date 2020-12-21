import fs from 'fs'
import path from 'path'
import resolve from 'resolve'
import { Plugin } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from '../constants'
import {
  createDebugger,
  isExternalUrl,
  isObject,
  normalizePath
} from '../utils'

export const FAILED_RESOLVE = `__vite_failed_resolve__`

const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx']
const mainFields = ['module', 'jsnext', 'jsnext:main', 'browser', 'main']

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin(
  root: string,
  isBuild: boolean,
  allowUrls = true
): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      let res
      if (allowUrls && id.startsWith(FILE_PREFIX)) {
        // explicit fs paths that starts with /@fs/*
        // these are injected by the rewrite plugin so that the file can work
        // in the browser
        let fsPath = id.slice(FILE_PREFIX.length - 1)
        if (fsPath.startsWith('//')) fsPath = fsPath.slice(1)
        res = tryFsResolve(fsPath, false)
        isDebug && debug(`[@fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return res || fsPath
      }

      // URL
      // /foo -> /fs-root/foo
      if (allowUrls && id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
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

      // bare package imports, perform node resolve
      if (
        /^[\w@]/.test(id) &&
        (res = tryNodeResolve(id, importer ? path.dirname(importer) : root))
      ) {
        return res
      }

      isDebug && debug(`[fallthrough] ${chalk.dim(id)}`)
      return this.resolve(id, importer, {
        skipSelf: true
      }).then((result) => {
        if (isBuild) return result
        return result || FAILED_RESOLVE
      })
    }
  }
}

function tryFsResolve(fsPath: string, tryIndex = true): string | undefined {
  const [file, q] = fsPath.split(`?`)
  const query = q ? `?${q}` : ``
  let res: string | undefined
  if ((res = tryResolveFile(file, query, tryIndex))) {
    return res
  }
  for (const ext of supportedExts) {
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

const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

let isRunningWithYarnPnp: boolean
try {
  isRunningWithYarnPnp = Boolean(require('pnpapi'))
} catch {}

function tryNodeResolve(id: string, basedir: string): string | undefined {
  const deepMatch = id.match(deepImportRE)
  const pkgId = deepMatch ? deepMatch[1] || deepMatch[2] : id
  const pkgData = resolvePackageData(pkgId, basedir)

  if (pkgData) {
    if (deepMatch) {
      return resolveDeepImport(id, pkgData)
    } else {
      // resolve package entry
      return resolvePackageEntry(id, pkgData)
    }
  } else {
    isDebug && debug(`${chalk.red(`[failed node resolve]`)} ${id}`)
  }
}

interface PackageData {
  dir: string
  data: {
    [field: string]: any
    exports: string | Record<string, any> | string[]
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
    const pkgPath = resolve.sync(`${id}/package.json`, {
      basedir,
      extensions: supportedExts,
      // necessary to work with pnpm
      preserveSymlinks: isRunningWithYarnPnp || false
    })
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

function resolvePackageEntry(
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
    isDebug && debug(`${chalk.red(`[missing pkg entry]`)} ${id}`)
  }
}

function resolveDeepImport(
  id: string,
  { dir, data }: PackageData
): string | undefined {
  let relativeId: string | undefined = '.' + id.slice(data.name.length)
  const { exports: exportsField } = data
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
  return normalize(foundEntry[1])
}
