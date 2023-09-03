import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import type { InternalResolveOptions, ResolveOptions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import {
  bareImportRE,
  createDebugger,
  createFilter,
  getNpmPackageName,
  isBuiltin,
  isDefined,
  isInNodeModules,
  lookupFile,
  normalizePath,
  withTrailingSlash,
} from '../utils'
import type { Logger, ResolvedConfig } from '..'
import { resolvePackageData } from '../packages'

const debug = createDebugger('vite:ssr-external')

/**
 * Converts "parent > child" syntax to just "child"
 */
export function stripNesting(packages: string[]): string[] {
  return packages.map((s) => {
    const arr = s.split('>')
    return arr[arr.length - 1].trim()
  })
}

/**
 * Heuristics for determining whether a dependency should be externalized for
 * server-side rendering.
 */
export function cjsSsrResolveExternals(
  config: ResolvedConfig,
  knownImports: string[],
): string[] {
  // strip nesting since knownImports may be passed in from optimizeDeps which
  // supports a "parent > child" syntax
  knownImports = stripNesting(knownImports)

  const ssrConfig = config.ssr
  if (ssrConfig?.noExternal === true) {
    return []
  }

  const ssrExternals: Set<string> = new Set()
  const seen: Set<string> = new Set()
  ssrConfig?.external?.forEach((id) => {
    ssrExternals.add(id)
    seen.add(id)
  })

  cjsSsrCollectExternals(
    config.root,
    config.resolve,
    ssrExternals,
    seen,
    config.logger,
  )

  const importedDeps = knownImports.map(getNpmPackageName).filter(isDefined)
  for (const dep of importedDeps) {
    // Assume external if not yet seen
    // At this point, the project root and any linked packages have had their dependencies checked,
    // so we can safely mark any knownImports not yet seen as external. They are guaranteed to be
    // dependencies of packages in node_modules.
    if (!seen.has(dep)) {
      ssrExternals.add(dep)
    }
  }

  // ensure `vite/dynamic-import-polyfill` is bundled (issue #1865)
  ssrExternals.delete('vite')

  let externals = [...ssrExternals]
  if (ssrConfig?.noExternal) {
    externals = externals.filter(
      createFilter(undefined, ssrConfig.noExternal, { resolve: false }),
    )
  }
  return externals
}

const CJS_CONTENT_RE =
  /\bmodule\.exports\b|\bexports[.[]|\brequire\s*\(|\bObject\.(?:defineProperty|defineProperties|assign)\s*\(\s*exports\b/

// TODO: use import()
const _require = createRequire(import.meta.url)

const isSsrExternalCache = new WeakMap<
  ResolvedConfig,
  (id: string, importer?: string) => boolean | undefined
>()

export function shouldExternalizeForSSR(
  id: string,
  importer: string | undefined,
  config: ResolvedConfig,
): boolean | undefined {
  let isSsrExternal = isSsrExternalCache.get(config)
  if (!isSsrExternal) {
    isSsrExternal = createIsSsrExternal(config)
    isSsrExternalCache.set(config, isSsrExternal)
  }
  return isSsrExternal(id, importer)
}

export function createIsConfiguredAsSsrExternal(
  config: ResolvedConfig,
): (id: string, importer?: string) => boolean {
  const { ssr, root } = config
  const noExternal = ssr?.noExternal
  const noExternalFilter =
    noExternal !== 'undefined' &&
    typeof noExternal !== 'boolean' &&
    createFilter(undefined, noExternal, { resolve: false })

  const resolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root,
    isProduction: false,
    isBuild: true,
  }

  const isExternalizable = (
    id: string,
    importer?: string,
    configuredAsExternal?: boolean,
  ): boolean => {
    if (!bareImportRE.test(id) || id.includes('\0')) {
      return false
    }
    try {
      return !!tryNodeResolve(
        id,
        // Skip passing importer in build to avoid externalizing non-hoisted dependencies
        // unresolveable from root (which would be unresolvable from output bundles also)
        config.command === 'build' ? undefined : importer,
        resolveOptions,
        ssr?.target === 'webworker',
        undefined,
        true,
        // try to externalize, will return undefined or an object without
        // a external flag if it isn't externalizable
        true,
        // Allow linked packages to be externalized if they are explicitly
        // configured as external
        !!configuredAsExternal,
      )?.external
    } catch (e) {
      debug?.(
        `Failed to node resolve "${id}". Skipping externalizing it by default.`,
      )
      // may be an invalid import that's resolved by a plugin
      return false
    }
  }

  // Returns true if it is configured as external, false if it is filtered
  // by noExternal and undefined if it isn't affected by the explicit config
  return (id: string, importer?: string) => {
    const { ssr } = config
    if (ssr) {
      if (
        // If this id is defined as external, force it as external
        // Note that individual package entries are allowed in ssr.external
        ssr.external?.includes(id)
      ) {
        return true
      }
      const pkgName = getNpmPackageName(id)
      if (!pkgName) {
        return isExternalizable(id, importer)
      }
      if (
        // A package name in ssr.external externalizes every
        // externalizable package entry
        ssr.external?.includes(pkgName)
      ) {
        return isExternalizable(id, importer, true)
      }
      if (typeof noExternal === 'boolean') {
        return !noExternal
      }
      if (noExternalFilter && !noExternalFilter(pkgName)) {
        return false
      }
    }
    return isExternalizable(id, importer)
  }
}

function createIsSsrExternal(
  config: ResolvedConfig,
): (id: string, importer?: string) => boolean | undefined {
  const processedIds = new Map<string, boolean | undefined>()

  const isConfiguredAsExternal = createIsConfiguredAsSsrExternal(config)

  return (id: string, importer?: string) => {
    if (processedIds.has(id)) {
      return processedIds.get(id)
    }
    let external = false
    if (id[0] !== '.' && !path.isAbsolute(id)) {
      external = isBuiltin(id) || isConfiguredAsExternal(id, importer)
    }
    processedIds.set(id, external)
    return external
  }
}

// When config.experimental.buildSsrCjsExternalHeuristics is enabled, this function
// is used reverting to the Vite 2.9 SSR externalization heuristics
function cjsSsrCollectExternals(
  root: string,
  resolveOptions: Required<ResolveOptions>,
  ssrExternals: Set<string>,
  seen: Set<string>,
  logger: Logger,
) {
  const rootPkgPath = lookupFile(root, ['package.json'])
  if (!rootPkgPath) {
    return
  }
  const rootPkgContent = fs.readFileSync(rootPkgPath, 'utf-8')
  if (!rootPkgContent) {
    return
  }

  const rootPkg = JSON.parse(rootPkgContent)
  const deps = {
    ...rootPkg.devDependencies,
    ...rootPkg.dependencies,
  }

  const internalResolveOptions: InternalResolveOptions = {
    ...resolveOptions,
    root,
    isProduction: false,
    isBuild: true,
  }

  const depsToTrace = new Set<string>()

  for (const id in deps) {
    if (seen.has(id)) continue
    seen.add(id)

    let esmEntry: string | undefined
    let requireEntry: string

    try {
      esmEntry = tryNodeResolve(
        id,
        undefined,
        internalResolveOptions,
        true, // we set `targetWeb` to `true` to get the ESM entry
        undefined,
        true,
      )?.id
      // normalizePath required for windows. tryNodeResolve uses normalizePath
      // which returns with '/', require.resolve returns with '\\'
      requireEntry = normalizePath(_require.resolve(id, { paths: [root] }))
    } catch (e) {
      // no main entry, but deep imports may be allowed
      const pkgDir = resolvePackageData(id, root)?.dir
      if (pkgDir) {
        if (isInNodeModules(pkgDir)) {
          ssrExternals.add(id)
        } else {
          depsToTrace.add(path.dirname(pkgDir))
        }
        continue
      }

      // resolve failed, assume include
      debug?.(`Failed to resolve entries for package "${id}"\n`, e)
      continue
    }
    // no esm entry but has require entry
    if (!esmEntry) {
      ssrExternals.add(id)
    }
    // trace the dependencies of linked packages
    else if (!isInNodeModules(esmEntry)) {
      const pkgDir = resolvePackageData(id, root)?.dir
      if (pkgDir) {
        depsToTrace.add(pkgDir)
      }
    }
    // has separate esm/require entry, assume require entry is cjs
    else if (esmEntry !== requireEntry) {
      ssrExternals.add(id)
    }
    // if we're externalizing ESM and CJS should basically just always do it?
    // or are there others like SystemJS / AMD that we'd need to handle?
    // for now, we'll just leave this as is
    else if (/\.m?js$/.test(esmEntry)) {
      const pkg = resolvePackageData(id, root)?.data
      if (!pkg) {
        continue
      }

      if (pkg.type === 'module' || esmEntry.endsWith('.mjs')) {
        ssrExternals.add(id)
        continue
      }
      // check if the entry is cjs
      const content = fs.readFileSync(esmEntry, 'utf-8')
      if (CJS_CONTENT_RE.test(content)) {
        ssrExternals.add(id)
        continue
      }

      logger.warn(
        `${id} doesn't appear to be written in CJS, but also doesn't appear to be a valid ES module (i.e. it doesn't have "type": "module" or an .mjs extension for the entry point). Please contact the package author to fix.`,
      )
    }
  }

  for (const depRoot of depsToTrace) {
    cjsSsrCollectExternals(depRoot, resolveOptions, ssrExternals, seen, logger)
  }
}

export function cjsShouldExternalizeForSSR(
  id: string,
  externals: string[] | null,
): boolean {
  if (!externals) {
    return false
  }
  const should = externals.some((e) => {
    if (id === e) {
      return true
    }
    // deep imports, check ext before externalizing - only externalize
    // extension-less imports and explicit .js imports
    if (
      id.startsWith(withTrailingSlash(e)) &&
      (!path.extname(id) || id.endsWith('.js'))
    ) {
      return true
    }
  })
  return should
}
