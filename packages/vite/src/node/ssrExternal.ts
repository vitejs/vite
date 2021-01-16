import fs from 'fs'
import path from 'path'
import { tryNodeResolve } from './plugins/resolve'
import { lookupFile, resolveFrom } from './utils'

/**
 * Heuristics for determining whether a dependency should be externalized for
 * server-side rendering.
 */
export function resolveSSRExternal(root: string): string[] {
  const pkgContent = lookupFile(root, ['package.json'])
  if (!pkgContent) {
    return []
  }
  const pkg = JSON.parse(pkgContent)
  const ssrExternals = Object.keys(pkg.devDependencies || {})
  const deps = Object.keys(pkg.dependencies || {})
  for (const dep of deps) {
    const entry = tryNodeResolve(dep, root, false)?.id
    let requireEntry
    try {
      requireEntry = require.resolve(dep, { paths: [root] })
    } catch (e) {
      continue
    }
    if (!entry) {
      // no esm entry but has require entry (is this even possible?)
      ssrExternals.push(dep)
      continue
    }
    // node resolve and esm resolve resolves to the same file
    if (path.extname(entry) !== '.js') {
      // entry is not js, cannot externalize
      continue
    }
    if (!entry.includes('node_modules')) {
      // entry is not a node dep, possibly linked - don't externalize
      // instead, trace its dependencies.
      const depRoot = path.dirname(resolveFrom(`${dep}/package.json`, root))
      ssrExternals.push(...resolveSSRExternal(depRoot))
      continue
    }
    if (entry !== requireEntry) {
      // has separate esm/require entry, assume require entry is cjs
      ssrExternals.push(dep)
    } else {
      // node resolve and esm resolve resolves to the same file.
      // check if the entry is cjs
      const content = fs.readFileSync(entry, 'utf-8')
      if (/\bmodule\.exports\b|\bexports[.\[]|\brequire\s*\(/.test(content)) {
        ssrExternals.push(dep)
      }
    }
  }
  return [...new Set(ssrExternals)]
}
