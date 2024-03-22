import type { FetchFunction, FetchResult } from './types'

export interface RunnerTransport {
  fetchModule: FetchFunction
}

// TODO: tests
export class RemoteRunnerTransport implements RunnerTransport {
  private rpcPromises = new Map<
    string,
    {
      resolve: (data: any) => void
      reject: (data: any) => void
      timeoutId?: NodeJS.Timeout
    }
  >()

  constructor(
    private readonly options: {
      send: (data: any) => void
      onMessage: (handler: (data: any) => void) => void
      timeout?: number
    },
  ) {
    this.options.onMessage(async (data) => {
      if (typeof data !== 'object' || !data || !data._v) return

      const promise = this.rpcPromises.get(data.i)
      if (!promise) return

      if (promise.timeoutId) clearTimeout(promise.timeoutId)

      this.rpcPromises.delete(data.i)

      if (data.e) {
        promise.reject(data.e)
      } else {
        promise.resolve(data.r)
      }
    })
  }

  private resolve<T>(method: string, ...args: any[]) {
    const promiseId = nanoid()
    this.options.send({
      _v: true,
      m: method,
      a: args,
      i: promiseId,
    })

    return new Promise<T>((resolve, reject) => {
      const timeout = this.options.timeout ?? 60000
      let timeoutId
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.rpcPromises.delete(promiseId)
          reject(
            new Error(
              `${method}(${args.map((arg) => JSON.stringify(arg)).join(', ')}) timed out after ${timeout}ms`,
            ),
          )
        }, timeout)
        timeoutId?.unref?.()
      }
      this.rpcPromises.set(promiseId, { resolve, reject, timeoutId })
    })
  }

  fetchModule(id: string, importer?: string): Promise<FetchResult> {
    return this.resolve<FetchResult>('fetchModule', id, importer)
  }
}

// port from nanoid
// https://github.com/ai/nanoid
const urlAlphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
function nanoid(size = 21) {
  let id = ''
  let i = size
  while (i--) id += urlAlphabet[(Math.random() * 64) | 0]
  return id
}