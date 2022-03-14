import fs from 'fs'
import path from 'path'
import { createFilter } from '@rollup/pluginutils'
import type { InternalResolveOptions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import {
  createDebugger,
  isDefined,
  lookupFile,
  normalizePath,
  resolveFrom
} from '../utils'
import type { Logger, ResolvedConfig } from '..'

const debug = createDebugger('vite:ssr-external')

/**
 * Converts "parent > child" syntax to just "child"
 */
export function stripNesting(packages: string[]) {
  return packages.map((s) => {
    const arr = s.split('>')
    return arr[arr.length - 1].trim()
  })
}

/**
 * Heuristics for determining whether a dependency should be externalized for
 * server-side rendering.
 */
export function resolveSSRExternal(
  config: ResolvedConfig,
  knownImports: string[]
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

  collectExternals(
    config.root,
    config.resolve.preserveSymlinks,
    ssrExternals,
    seen,
    config.logger
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
      createFilter(undefined, ssrConfig.noExternal, { resolve: false })
    )
  }
  return externals
}

// do we need to do this ahead of time or could we do it lazily?
function collectExternals(
  root: string,
  preserveSymlinks: boolean | undefined,
  ssrExternals: Set<string>,
  seen: Set<string>,
  logger: Logger
) {
  const rootPkgContent = lookupFile(root, ['package.json'])
  if (!rootPkgContent) {
    return
  }

  const rootPkg = JSON.parse(rootPkgContent)
  const deps = {
    ...rootPkg.devDependencies,
    ...rootPkg.dependencies
  }

  const resolveOptions: InternalResolveOptions = {
    root,
    preserveSymlinks,
    isProduction: false,
    isBuild: true
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
        resolveOptions,
        true, // we set `targetWeb` to `true` to get the ESM entry
        undefined,
        true
      )?.id
      // normalizePath required for windows. tryNodeResolve uses normalizePath
      // which returns with '/', require.resolve returns with '\\'
      requireEntry = normalizePath(require.resolve(id, { paths: [root] }))
    } catch (e) {
      try {
        // no main entry, but deep imports may be allowed
        const pkgPath = resolveFrom(`${id}/package.json`, root)
        if (pkgPath.includes('node_modules')) {
          ssrExternals.add(id)
        } else {
          depsToTrace.add(path.dirname(pkgPath))
        }
        continue
      } catch {}

      // resolve failed, assume include
      debug(`Failed to resolve entries for package "${id}"\n`, e)
      continue
    }

    const pkgPath = resolveFrom(`${id}/package.json`, root)
    const pkgContent = fs.readFileSync(pkgPath, 'utf-8')

    if (!pkgContent) {
      continue
    }
    const pkg = JSON.parse(pkgContent)

    if (pkg.type === 'module') {
      if (requireEntry && !requireEntry.endsWith('.cjs')) {
        logger.warn(
          `${id} must use a .cjs extension for the CJS entry point when "type": "module" is set. Please contact the package author to fix.`
        )
      }
    } else {
      if (esmEntry && !esmEntry.endsWith('.mjs')) {
        logger.warn(
          `${id} must either set "type": "module" or use an .mjs extension for the ESM entry point. Please contact the package author to fix.`
        )
      }
    }

    if (esmEntry && !esmEntry.includes('node_modules')) {
      // trace the dependencies of linked packages
      const pkgPath = resolveFrom(`${id}/package.json`, root)
      depsToTrace.add(path.dirname(pkgPath))
    } else {
      ssrExternals.add(id)
    }
  }

  for (const depRoot of depsToTrace) {
    collectExternals(depRoot, preserveSymlinks, ssrExternals, seen, logger)
  }
}

export function shouldExternalizeForSSR(
  id: string,
  externals: string[]
): boolean {
  const should = externals.some((e) => {
    if (id === e) {
      return true
    }
    // deep imports, check ext before externalizing - only externalize
    // extension-less imports and explicit .js imports
    if (id.startsWith(e + '/') && (!path.extname(id) || id.endsWith('.js'))) {
      return true
    }
  })
  return should
}

function getNpmPackageName(importPath: string): string | null {
  const parts = importPath.split('/')
  if (parts[0].startsWith('@')) {
    if (!parts[1]) return null
    return `${parts[0]}/${parts[1]}`
  } else {
    return parts[0]
  }
}
