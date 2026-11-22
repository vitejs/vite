import { isPrimitive } from '../shared/utils'

// The state below only lives while modules are evaluating: once the last
// evaluation settles, no namespace can gain keys anymore and it is reset.
let activeEvaluations = 0
// namespaces of inlined modules being evaluated
const evaluatingExports = new Set<object>()
// namespaces doing `export *` from a namespace that may still gain keys
const pendingStarExports = new Set<object>()
// source namespace -> namespaces doing `export *` from it
const starExportDependents = new Map<object, Set<object>>()
// pending namespaces whose seal waits for the evaluations to settle
const deferredSeals = new Set<object>()

export function startEvaluation(exports: object): void {
  activeEvaluations++
  evaluatingExports.add(exports)
}

export function endEvaluation(exports: object): void {
  evaluatingExports.delete(exports)
  if (--activeEvaluations === 0) {
    for (const deferred of deferredSeals) {
      Object.seal(deferred)
    }
    deferredSeals.clear()
    pendingStarExports.clear()
    starExportDependents.clear()
  }
}

// seal the namespace, or defer it while it may still gain keys through
// `export *` from a module that is still evaluating in an import cycle
export function sealExports(exports: object): void {
  if (pendingStarExports.has(exports)) {
    deferredSeals.add(exports)
  } else {
    Object.seal(exports)
  }
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
