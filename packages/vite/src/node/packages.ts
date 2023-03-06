import fs from 'node:fs'
import path from 'node:path'
import type { Exports, Imports } from 'resolve.exports'
import { createDebugger, createFilter, resolveFrom } from './utils'
import type { ResolvedConfig } from './config'
import type { Plugin } from './plugin'

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true,
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
    exports: Exports
    imports: Imports
    dependencies: Record<string, string>
  }
}

export function invalidatePackageData(
  packageCache: PackageCache,
  pkgPath: string,
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
  packageCache?: PackageCache,
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
  packageCache?: PackageCache,
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
  const { sideEffects } = data
  let hasSideEffects: (id: string) => boolean
  if (typeof sideEffects === 'boolean') {
    hasSideEffects = () => sideEffects
  } else if (Array.isArray(sideEffects)) {
    const finalPackageSideEffects = sideEffects.map((sideEffect) => {
      /*
       * The array accepts simple glob patterns to the relevant files... Patterns like *.css, which do not include a /, will be treated like **\/*.css.
       * https://webpack.js.org/guides/tree-shaking/
       * https://github.com/vitejs/vite/pull/11807
       */
      if (sideEffect.includes('/')) {
        return sideEffect
      }
      return `**/${sideEffect}`
    })

    hasSideEffects = createFilter(finalPackageSideEffects, null, {
      resolve: pkgDir,
    })
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
    },
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
    },
  }
}
