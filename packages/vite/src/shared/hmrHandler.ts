import type { HotPayload } from 'types/hmrPayload'

// updates to HMR should go one after another. It is possible to trigger another update during the invalidation for example.
export function createHMRHandler(
  handler: (payload: HotPayload) => Promise<void>,
): (payload: HotPayload) => Promise<void> {
  const queue = new Queue()
  return (payload) => queue.enqueue(() => handler(payload))
}

class Queue {
  private queue: {
    promise: () => Promise<void>
    resolve: (value?: unknown) => void
    reject: (err?: unknown) => void
  }[] = []
  private pending = false

  enqueue(promise: () => Promise<void>): Promise<void> {
    return new Promise<any>((resolve, reject) => {
      this.queue.push({
        promise,
        resolve,
        reject,
      })
      this.dequeue()
    })
  }

  dequeue(): boolean {
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
