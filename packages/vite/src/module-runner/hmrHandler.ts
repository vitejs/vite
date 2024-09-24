import type { HotPayload } from 'types/hmrPayload'
import { slash, unwrapId } from '../shared/utils'
import type { ModuleRunner } from './runner'

// updates to HMR should go one after another. It is possible to trigger another update during the invalidation for example.
export function createHMRHandler(
  runner: ModuleRunner,
): (payload: HotPayload) => Promise<void> {
  const queue = new Queue()
  return (payload) => queue.enqueue(() => handleHotPayload(runner, payload))
}

export async function handleHotPayload(
  runner: ModuleRunner,
  payload: HotPayload,
): Promise<void> {
  const hmrClient = runner.hmrClient
  if (!hmrClient || runner.isDestroyed()) return
  switch (payload.type) {
    case 'connected':
      hmrClient.logger.debug(`connected.`)
      hmrClient.messenger.flush()
      break
    case 'update':
      await hmrClient.notifyListeners('vite:beforeUpdate', payload)
      await Promise.all(
        payload.updates.map(async (update): Promise<void> => {
          if (update.type === 'js-update') {
            // runner always caches modules by their full path without /@id/ prefix
            update.acceptedPath = unwrapId(update.acceptedPath)
            update.path = unwrapId(update.path)
            return hmrClient.queueUpdate(update)
          }

          hmrClient.logger.error('css hmr is not supported in runner mode.')
        }),
      )
      await hmrClient.notifyListeners('vite:afterUpdate', payload)
      break
    case 'custom': {
      await hmrClient.notifyListeners(payload.event, payload.data)
      break
    }
    case 'full-reload': {
      const { triggeredBy } = payload
      const clearEntrypointUrls = triggeredBy
        ? getModulesEntrypoints(
            runner,
            getModulesByFile(runner, slash(triggeredBy)),
          )
        : findAllEntrypoints(runner)

      if (!clearEntrypointUrls.size) break

      hmrClient.logger.debug(`program reload`)
      await hmrClient.notifyListeners('vite:beforeFullReload', payload)
      runner.evaluatedModules.clear()

      for (const url of clearEntrypointUrls) {
        await runner.import(url)
      }
      break
    }
    case 'prune':
      await hmrClient.notifyListeners('vite:beforePrune', payload)
      await hmrClient.prunePaths(payload.paths)
      break
    case 'error': {
      await hmrClient.notifyListeners('vite:error', payload)
      const err = payload.err
      hmrClient.logger.error(
        `Internal Server Error\n${err.message}\n${err.stack}`,
      )
      break
    }
    default: {
      const check: never = payload
      return check
    }
  }
}

class Queue {
  private queue: {
    promise: () => Promise<void>
    resolve: (value?: unknown) => void
    reject: (err?: unknown) => void
  }[] = []
  private pending = false

  enqueue(promise: () => Promise<void>) {
    return new Promise<any>((resolve, reject) => {
      this.queue.push({
        promise,
        resolve,
        reject,
      })
      this.dequeue()
    })
  }

  dequeue() {
    if (this.pending) {
      return false
    }
    const item = this.queue.shift()
    if (!item) {
      return false
    }
    this.pending = true
    item
      .promise()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        this.pending = false
        this.dequeue()
      })
    return true
  }
}

function getModulesByFile(runner: ModuleRunner, file: string): string[] {
  const nodes = runner.evaluatedModules.getModulesByFile(file)
  if (!nodes) {
    return []
  }
  return [...nodes].map((node) => node.id)
}

function getModulesEntrypoints(
  runner: ModuleRunner,
  modules: string[],
  visited = new Set<string>(),
  entrypoints = new Set<string>(),
) {
  for (const moduleId of modules) {
    if (visited.has(moduleId)) continue
    visited.add(moduleId)
    const module = runner.evaluatedModules.getModuleById(moduleId)
    if (!module) {
      continue
    }
    if (module.importers && !module.importers.size) {
      entrypoints.add(module.url)
      continue
    }
    for (const importer of module.importers || []) {
      getModulesEntrypoints(runner, [importer], visited, entrypoints)
    }
  }
  return entrypoints
}

function findAllEntrypoints(
  runner: ModuleRunner,
  entrypoints = new Set<string>(),
): Set<string> {
  for (const mod of runner.evaluatedModules.idToModuleMap.values()) {
    if (mod.importers && !mod.importers.size) {
      entrypoints.add(mod.url)
    }
  }
  return entrypoints
}
