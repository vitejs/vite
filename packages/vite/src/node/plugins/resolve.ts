import fs from 'fs'
import path from 'path'
import resolve from 'resolve'
import { createDebugger } from '../utils'
import { Plugin } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from '../constants'
import { isCSSProxy } from './css'

export const FAILED_RESOLVE = `__vite_failed_resolve__`

const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
const mainFields = ['module', 'jsnext', 'jsnext:main', 'browser', 'main']

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin(root: string, allowUrls = true): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      const isCSSProxyId = isCSSProxy(id)
      if (isCSSProxyId) {
        id = id.slice(0, -3)
      }
      const restoreCSSProxy = (res: string) =>
        isCSSProxyId ? res + '.js' : res

      let res
      if (allowUrls && id.startsWith(FILE_PREFIX)) {
        // explicit fs paths that starts with /@fs/*
        // these are injected by the rewrite plugin so that the file can work
        // in the browser
        let fsPath = id.slice(FILE_PREFIX.length - 1)
        if (fsPath.startsWith('//')) fsPath = fsPath.slice(1)
        res = tryFsResolve(fsPath)
        isDebug && debug(`[@fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return restoreCSSProxy(res || fsPath)
      }

      // URL
      // /foo -> /fs-root/foo
      if (allowUrls && id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return restoreCSSProxy(res)
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return restoreCSSProxy(res)
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return restoreCSSProxy(res)
      }

      // bare package imports, perform node resolve
      if (
        /^[\w@]/.test(id) &&
        (res = tryNodeResolve(id, importer ? path.dirname(importer) : root))
      ) {
        return restoreCSSProxy(res)
      }

      isDebug && debug(`[fallthrough] ${chalk.dim(id)}`)
      return this.resolve(id, importer, {
        skipSelf: true
      }).then((result) => {
        return result || FAILED_RESOLVE
      })
    }
  }
}

function tryFsResolve(fsPath: string) {
  const [file, q] = fsPath.split(`?`)
  const query = q ? `?${q}` : ``
  if (fs.existsSync(file)) {
    return file + query
  }
  for (const ext of supportedExts) {
    if (fs.existsSync(file + ext)) {
      return file + ext + query
    }
  }
}

const deepImportRE = /^([^@][^/]*)\/|^(@[^/]+\/[^/]+)\//

let isRunningWithYarnPnp: boolean
try {
  isRunningWithYarnPnp = Boolean(require('pnpapi'))
} catch {}

function tryNodeResolve(id: string, basedir: string): string | undefined {
  let result: string | undefined
  const isDeep = deepImportRE.test(id)
  const resolveTarget = isDeep ? id : `${id}/package.json`

  try {
    result = resolve.sync(resolveTarget, {
      basedir,
      extensions: supportedExts,
      // necessary to work with pnpm
      preserveSymlinks: isRunningWithYarnPnp || false
    })
  } catch (e) {
    isDebug && debug(`${chalk.red(`[failed node resolve]`)} ${id}`)
  }

  if (result) {
    if (isDeep) {
      // deep import, return as-is
      isDebug &&
        debug(`[node/deep-import] ${chalk.cyan(id)} -> ${chalk.dim(result)}`)
      return result
    } else {
      // resolve package entry
      return resolvePackageEntry(id, result)
    }
  }
}

function resolvePackageEntry(id: string, pkgPath: string): string | undefined {
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  } catch (e) {
    isDebug && debug(`${chalk.red(`[failed pkg read]`)} ${pkgPath}`)
    return
  }

  let entryPoint: string = 'index.js'

  for (const field of mainFields) {
    if (typeof pkg[field] === 'string') {
      entryPoint = pkg[field]
      break
    }
  }

  // resolve object browser field in package.json
  // https://github.com/defunctzombie/package-browser-field-spec
  const { browser: browserField } = pkg
  if (browserField && typeof browserField === 'object') {
    entryPoint = mapWithBrowserField(entryPoint, browserField)
  }

  entryPoint = path.resolve(path.dirname(pkgPath), entryPoint)
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
