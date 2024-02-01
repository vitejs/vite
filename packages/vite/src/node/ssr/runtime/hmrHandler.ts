import type { HMRPayload } from 'types/hmrPayload'
import type { ViteRuntime } from './runtime'
import { unwrapId } from './utils'

// updates to HMR should go one after another. It is possible to trigger another update during the invalidation for example.
export function createHMRHandler(
  runtime: ViteRuntime,
): (payload: HMRPayload) => Promise<void> {
  const queue = new Queue()
  return (payload) => queue.enqueue(() => handleHMRPayload(runtime, payload))
}

export async function handleHMRPayload(
  runtime: ViteRuntime,
  payload: HMRPayload,
): Promise<void> {
  const hmrClient = runtime.hmrClient
  if (!hmrClient || runtime.isDestroyed()) return
  switch (payload.type) {
    case 'connected':
      hmrClient.logger.debug(`[vite] connected.`)
      hmrClient.messenger.flush()
      break
    case 'update':
      await hmrClient.notifyListeners('vite:beforeUpdate', payload)
      await Promise.all(
        payload.updates.map(async (update): Promise<void> => {
          if (update.type === 'js-update') {
            // runtime always caches modules by their full path without /@id/ prefix
            update.acceptedPath = unwrapId(update.acceptedPath)
            update.path = unwrapId(update.path)
            return hmrClient.queueUpdate(update)
          }

          hmrClient.logger.error(
            '[vite] css hmr is not supported in runtime mode.',
          )
        }),
      )
      await hmrClient.notifyListeners('vite:afterUpdate', payload)
      break
    case 'custom': {
      await hmrClient.notifyListeners(payload.event, payload.data)
      break
    }
    case 'full-reload':
      hmrClient.logger.debug(`[vite] program reload`)
      await hmrClient.notifyListeners('vite:beforeFullReload', payload)
      Array.from(runtime.moduleCache.keys()).forEach((id) => {
        if (!id.includes('node_modules')) {
          runtime.moduleCache.deleteByModuleId(id)
        }
      })
      for (const id of runtime.entrypoints) {
        await runtime.executeUrl(id)
      }
      break
    case 'prune':
      await hmrClient.notifyListeners('vite:beforePrune', payload)
      hmrClient.prunePaths(payload.paths)
      break
    case 'error': {
      await hmrClient.notifyListeners('vite:error', payload)
      const err = payload.err
      hmrClient.logger.error(
        `[vite] Internal Server Error\n${err.message}\n${err.stack}`,
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
