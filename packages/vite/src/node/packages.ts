import fs from 'node:fs'
import path from 'node:path'
import { createDebugger, createFilter, lookupFile, resolveFrom } from './utils'
import type { ResolvedConfig } from './config'
import type { Plugin } from './plugin'

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
    imports: Record<string, any>
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

  packageCache?.set(pkgPath, pkg)
  return pkg
}

export function loadNearestPackageData(
  startDir: string,
  options?: { preserveSymlinks?: boolean },
  predicate?: (pkg: PackageData) => boolean
): PackageData | null {
  let importerPkg: PackageData | undefined
  lookupFile(startDir, ['package.json'], {
    pathOnly: true,
    predicate(pkgPath) {
      importerPkg = loadPackageData(pkgPath, options?.preserveSymlinks)
      return !predicate || predicate(importerPkg)
    }
  })
  return importerPkg || null
}

export function isNamedPackage(pkg: PackageData): boolean {
  return !!pkg.data.name
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

export function findPackageJson(dir: string): string | null {
  // Stop looking at node_modules directory.
  if (path.basename(dir) === 'node_modules') {
    return null
  }
  const pkgPath = path.join(dir, 'package.json')
  if (fs.existsSync(pkgPath)) {
    return pkgPath
  }
  const parentDir = path.dirname(dir)
  return parentDir !== dir ? findPackageJson(parentDir) : null
}

const workspaceRootFiles = ['lerna.json', 'pnpm-workspace.yaml', '.git']

export function isWorkspaceRoot(
  dir: string,
  preserveSymlinks?: boolean,
  packageCache?: PackageCache
): boolean {
  const files = fs.readdirSync(dir)
  if (files.some((file) => workspaceRootFiles.includes(file))) {
    return true // Found a lerna/pnpm workspace or git repository.
  }
  if (files.includes('package.json')) {
    const workspacePkg = loadPackageData(
      path.join(dir, 'package.json'),
      preserveSymlinks,
      packageCache
    )
    if (workspacePkg?.data.workspaces) {
      return true // Found a npm/yarn workspace.
    }
  }
  return false
}
