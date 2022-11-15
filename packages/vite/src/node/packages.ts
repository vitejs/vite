import fs from 'node:fs'
import path from 'node:path'
import { createDebugger, createFilter, getRealPath, resolveFrom } from './utils'
import type { ResolvedConfig } from './config'
import type { Plugin } from './plugin'
import type { SymlinkResolver } from './symlinks'

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

/** Cache for package.json resolution and package.json contents */
export type PackageCache = Map<string, PackageData>

export interface PackageData {
  dir: string
  hasSideEffects: (id: string) => boolean | 'no-treeshake'
  webResolvedImports: Record<string, string | undefined>
  nodeResolvedImports: Record<string, string | undefined>
  setResolvedCache: (key: string, entry: string, targetWeb: boolean) => void
  getResolvedCache: (key: string, targetWeb: boolean) => string | undefined
  data: {
    [field: string]: any
    name: string
    type: string
    version: string
    main: string
    module: string
    browser: string | Record<string, string | false>
    exports: string | Record<string, any> | string[]
    dependencies: Record<string, string>
  }
}

export function invalidatePackageData(
  packageCache: PackageCache,
  pkgPath: string
): void {
  packageCache.delete(pkgPath)
  const pkgDir = path.dirname(pkgPath)
  packageCache.forEach((pkg, cacheKey) => {
    if (pkg.dir === pkgDir) {
      packageCache.delete(cacheKey)
    }
  })
}

/**
 * Find and load the `package.json` associated with a module id.
 *
 * Using the `options.packageCache` argument is highly recommended for
 * performance. The easiest way is setting it to the `packageCache`
 * property of the `vite.ResolvedConfig` object.
 */
export function resolvePackageData(
  id: string,
  basedir: string,
  options?: LoadPackageOptions
): PackageData | null

/** @deprecated Use `options` object argument instead */
export function resolvePackageData(
  id: string,
  basedir: string,
  preserveSymlinks: boolean | undefined,
  packageCache?: PackageCache
): PackageData | null

export function resolvePackageData(
  id: string,
  basedir: string,
  arg3?: boolean | LoadPackageOptions,
  arg4?: PackageCache
): PackageData | null {
  const options =
    typeof arg3 === 'boolean'
      ? { preserveSymlinks: arg3, packageCache: arg4 }
      : arg3 || {}

  let pkg: PackageData | undefined
  let cacheKey: string | undefined
  if (options.packageCache) {
    cacheKey = `${id}&${basedir}&${options.preserveSymlinks || false}`
    if ((pkg = options.packageCache.get(cacheKey))) {
      return pkg
    }
  }

  let pkgPath: string | undefined
  try {
    pkgPath = resolveFrom(`${id}/package.json`, basedir, true)
    pkg = loadPackageData(pkgPath, options)
    options.packageCache?.set(cacheKey!, pkg)
    return pkg
  } catch (e) {
    if (e instanceof SyntaxError) {
      isDebug && debug(`Parsing failed: ${pkgPath}`)
    }
    // Ignore error for missing package.json
    else if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
  }
  return null
}

export type LoadPackageOptions = {
  preserveSymlinks?: boolean
  symlinkResolver?: SymlinkResolver
  packageCache?: PackageCache
}

/**
 * Load a `package.json` file into memory.
 *
 * Using the `options.packageCache` argument is highly recommended for
 * performance. The easiest way is setting it to the `packageCache`
 * property of the `vite.ResolvedConfig` object.
 */
export function loadPackageData(
  pkgPath: string,
  options?: LoadPackageOptions
): PackageData

/** @deprecated Use `options` object argument instead */
export function loadPackageData(
  pkgPath: string,
  preserveSymlinks: boolean | undefined,
  packageCache?: PackageCache
): PackageData

export function loadPackageData(
  pkgPath: string,
  arg2?: boolean | LoadPackageOptions,
  arg3?: PackageCache
): PackageData {
  const options =
    typeof arg2 === 'boolean'
      ? { preserveSymlinks: arg2, packageCache: arg3 }
      : arg2 || {}

  pkgPath = getRealPath(
    pkgPath,
    options.symlinkResolver,
    options.preserveSymlinks
  )

  let cached: PackageData | undefined
  if ((cached = options.packageCache?.get(pkgPath))) {
    return cached
  }

  const data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const pkgDir = path.dirname(pkgPath)
  const { sideEffects } = data
  let hasSideEffects: (id: string) => boolean
  if (typeof sideEffects === 'boolean') {
    hasSideEffects = () => sideEffects
  } else if (Array.isArray(sideEffects)) {
    hasSideEffects = createFilter(sideEffects, null, { resolve: pkgDir })
  } else {
    hasSideEffects = () => true
  }

  const pkg: PackageData = {
    dir: pkgDir,
    data,
    hasSideEffects,
    webResolvedImports: {},
    nodeResolvedImports: {},
    setResolvedCache(key: string, entry: string, targetWeb: boolean) {
      if (targetWeb) {
        pkg.webResolvedImports[key] = entry
      } else {
        pkg.nodeResolvedImports[key] = entry
      }
    },
    getResolvedCache(key: string, targetWeb: boolean) {
      if (targetWeb) {
        return pkg.webResolvedImports[key]
      } else {
        return pkg.nodeResolvedImports[key]
      }
    }
  }

  options.packageCache?.set(pkgPath, pkg)
  return pkg
}

export function watchPackageDataPlugin(config: ResolvedConfig): Plugin {
  const watchQueue = new Set<string>()
  let watchFile = (id: string) => {
    watchQueue.add(id)
  }

  const { packageCache } = config
  const setPackageData = packageCache.set.bind(packageCache)
  packageCache.set = (id, pkg) => {
    if (id.endsWith('.json')) {
      watchFile(id)
    }
    return setPackageData(id, pkg)
  }

  return {
    name: 'vite:watch-package-data',
    buildStart() {
      watchFile = this.addWatchFile
      watchQueue.forEach(watchFile)
      watchQueue.clear()
    },
    buildEnd() {
      watchFile = (id) => watchQueue.add(id)
    },
    watchChange(id) {
      if (id.endsWith('/package.json')) {
        invalidatePackageData(packageCache, id)
      }
    }
  }
}
