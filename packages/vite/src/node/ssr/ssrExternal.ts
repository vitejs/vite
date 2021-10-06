import fs from 'fs'
import path from 'path'
import { tryNodeResolve, InternalResolveOptions } from '../plugins/resolve'
import {
  createDebugger,
  lookupFile,
  normalizePath,
  resolveFrom
} from '../utils'
import { ResolvedConfig } from '..'
import { createFilter } from '@rollup/pluginutils'

const debug = createDebugger('vite:ssr-external')

/**
 * Heuristics for determining whether a dependency should be externalized for
 * server-side rendering.
 *
 * TODO right now externals are imported using require(), we probably need to
 * rework this when more libraries ship native ESM distributions for Node.
 */
export function resolveSSRExternal(
  config: ResolvedConfig,
  ssrExternals: Set<string> = new Set(),
  seen: Set<string> = new Set()
): string[] {
  const ssrConfig = config.ssr
  if (ssrConfig?.noExternal === true) {
    return []
  }
  ssrConfig?.external?.forEach((id) => {
    ssrExternals.add(id)
    seen.add(id)
  })

  collectExternals(config.root, ssrExternals, seen)
  ssrExternals.delete('vite')

  let externals = [...ssrExternals]
  if (ssrConfig?.noExternal) {
    externals = externals.filter(
      createFilter(undefined, ssrConfig.noExternal, { resolve: false })
    )
  }
  return externals
}

function collectExternals(
  root: string,
  ssrExternals: Set<string>,
  seen: Set<string>
) {
  const pkgContent = lookupFile(root, ['package.json'])
  if (!pkgContent) {
    return
  }

  const pkg = JSON.parse(pkgContent)
  const deps = {
    ...pkg.devDependencies,
    ...pkg.dependencies
  }

  const resolveOptions: InternalResolveOptions = {
    root,
    isProduction: false,
    isBuild: true
  }

  const depsToTrace = new Set<string>()

  for (const id in deps) {
    if (seen.has(id)) continue
    seen.add(id)

    let entry: string | undefined
    let requireEntry: string
    try {
      entry = tryNodeResolve(
        id,
        undefined,
        resolveOptions,
        true,
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
    // no esm entry but has require entry
    if (!entry) {
      ssrExternals.add(id)
    }
    // trace the dependencies of linked packages
    else if (!entry.includes('node_modules')) {
      const pkgPath = resolveFrom(`${id}/package.json`, root)
      depsToTrace.add(path.dirname(pkgPath))
    }
    // has separate esm/require entry, assume require entry is cjs
    else if (entry !== requireEntry) {
      ssrExternals.add(id)
    }
    // externalize js entries with commonjs
    else if (/\.m?js$/.test(entry)) {
      const content = fs.readFileSync(entry, 'utf-8')
      if (/\bmodule\.exports\b|\bexports[.\[]|\brequire\s*\(/.test(content)) {
        ssrExternals.add(id)
      }
    }
  }

  for (const depRoot of depsToTrace) {
    collectExternals(depRoot, ssrExternals, seen)
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
