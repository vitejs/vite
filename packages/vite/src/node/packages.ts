import fs from 'fs'
import path from 'path'
import { createFilter } from '@rollup/pluginutils'
import { createDebugger, resolveFrom } from './utils'
import { ResolvedConfig } from './config'
import { Plugin } from './plugin'

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

export function resolvePackageData(
  id: string,
  basedir: string,
  preserveSymlinks = false,
  packageCache?: PackageCache
): PackageData | null {
  let pkg: PackageData | undefined
  let cacheKey: string | undefined
  if (packageCache) {
    cacheKey = `${id}&${basedir}&${preserveSymlinks}`
    if ((pkg = packageCache.get(cacheKey))) {
      return pkg
    }
  }
  let pkgPath: string | undefined
  try {
    pkgPath = resolveFrom(`${id}/package.json`, basedir, preserveSymlinks)
    pkg = loadPackageData(pkgPath, true, packageCache)
    if (packageCache) {
      packageCache.set(cacheKey!, pkg)
    }
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

export function loadPackageData(
  pkgPath: string,
  preserveSymlinks?: boolean,
  packageCache?: PackageCache
): PackageData {
  if (!preserveSymlinks) {
    pkgPath = fs.realpathSync.native(pkgPath)
  }

  let cached: PackageData | undefined
  if ((cached = packageCache?.get(pkgPath))) {
    return cached
  }

  const data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const pkgDir = path.dirname(pkgPath)

  // When the "sideEffects" field is defined, we can assume modules
  // in the package are either side effect-free or not, which means
  // Rollup doesn't have to statically analyze the AST.
  const { sideEffects } = data
  let hasSideEffects: (id: string) => boolean | 'no-treeshake'
  if (typeof sideEffects === 'boolean') {
    hasSideEffects = () => sideEffects && 'no-treeshake'
  } else if (Array.isArray(sideEffects)) {
    const filter = createFilter(sideEffects, null, { resolve: pkgDir })
    hasSideEffects = (id) => filter(id) && 'no-treeshake'
  } else {
    // Statically analyze each module for side effects.
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

  packageCache?.set(pkgPath, pkg)
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
