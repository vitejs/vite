import { isPrimitive } from '../shared/utils'

// A namespace that does `export *` from a module still evaluating in an import
// cycle may gain keys until that module, and the ones it waits for in turn,
// finish evaluating. Entries are removed as soon as that happens.

// namespaces of inlined modules being evaluated
const evaluatingExports = new Set<object>()
// pending namespace -> evaluating namespaces it may still gain keys from
const blockers = new Map<object, Set<object>>()
// evaluating namespace -> pending namespaces it blocks
const waiters = new Map<object, Set<object>>()
// source namespace -> namespaces doing `export *` from it
const starExportDependents = new Map<object, Set<object>>()
// pending namespaces whose seal waits for them to settle
const deferredSeals = new Set<object>()

function getSet(map: Map<object, Set<object>>, key: object) {
  let set = map.get(key)
  if (!set) map.set(key, (set = new Set()))
  return set
}

function addBlocker(exports: object, blocker: object) {
  if (blocker === exports) return
  getSet(blockers, exports).add(blocker)
  getSet(waiters, blocker).add(exports)
}

function settle(exports: object) {
  if (evaluatingExports.has(exports) || blockers.get(exports)?.size) return
  blockers.delete(exports)
  starExportDependents.delete(exports)
  if (deferredSeals.delete(exports)) Object.seal(exports)
}

export function startEvaluation(exports: object): void {
  evaluatingExports.add(exports)
}

export function endEvaluation(exports: object): void {
  evaluatingExports.delete(exports)
  const inherited = blockers.get(exports)
  const pending = waiters.get(exports)
  waiters.delete(exports)
  if (pending) {
    for (const waiter of pending) {
      blockers.get(waiter)!.delete(exports)
      // it now waits for what this module was still waiting for
      if (inherited) {
        for (const blocker of inherited) addBlocker(waiter, blocker)
      }
      settle(waiter)
    }
  }
  settle(exports)
}

// seal the namespace, or defer it while it may still gain keys through
// `export *` from a module that is still evaluating in an import cycle
export function sealExports(exports: object): void {
  if (blockers.get(exports)?.size) {
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
  const sourceBlockers = blockers.get(sourceModule)
  if (evaluatingExports.has(sourceModule) || sourceBlockers?.size) {
    getSet(starExportDependents, sourceModule).add(exports)
    if (evaluatingExports.has(sourceModule)) addBlocker(exports, sourceModule)
    if (sourceBlockers) {
      for (const blocker of sourceBlockers) addBlocker(exports, blocker)
    }
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
