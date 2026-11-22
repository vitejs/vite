import { isPrimitive } from '../shared/utils'

// namespaces of inlined modules being evaluated
export const evaluatingExports: WeakSet<object> = new WeakSet()
// namespaces doing `export *` from a namespace that may still gain keys
const pendingStarExports = new WeakSet<object>()
// source namespace -> namespaces doing `export *` from it
const starExportDependents = new WeakMap<object, Set<object>>()

/**
 * Whether the namespace may still gain keys through `export *` from a module
 * that was still evaluating in an import cycle. Such namespaces must stay
 * extensible.
 */
export function mayGainStarExports(exports: object): boolean {
  return pendingStarExports.has(exports)
}

export function exportAll(exports: any, sourceModule: any): void {
  // when a module exports itself it causes
  // call stack error
  if (exports === sourceModule) return

  if (
    isPrimitive(sourceModule) ||
    Array.isArray(sourceModule) ||
    sourceModule instanceof Promise
  )
    return

  // in a cycle the source may gain keys later, forward them (#24183)
  if (
    evaluatingExports.has(sourceModule) ||
    pendingStarExports.has(sourceModule)
  ) {
    let dependents = starExportDependents.get(sourceModule)
    if (!dependents) {
      starExportDependents.set(sourceModule, (dependents = new Set()))
    }
    dependents.add(exports)
    pendingStarExports.add(exports)
  }

  let added = false
  for (const key in sourceModule) {
    if (key !== 'default' && key !== '__esModule' && !(key in exports)) {
      try {
        Object.defineProperty(exports, key, {
          enumerable: true,
          configurable: true,
          get: () => sourceModule[key],
        })
        added = true
      } catch {}
    }
  }

  if (added) {
    const dependents = starExportDependents.get(exports)
    if (dependents) {
      for (const dependent of dependents) {
        exportAll(dependent, exports)
      }
    }
  }
}
