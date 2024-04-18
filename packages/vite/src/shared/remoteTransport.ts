export interface TransportOptions<M extends TransportMethods> {
  send: (data: RequestEvent | ResponseEvent) => void
  onMessage: (handler: (data: any) => void) => void
  methods: M
  timeout?: number
}

export type TransportMethods = Record<string, (...args: any[]) => any>

export interface ResponseEvent {
  __v: 's'
  /** result */
  r?: any
  /** error */
  e?: any
  /** id */
  i: string
}

export interface RequestEvent {
  __v: 'q'
  /** method name */
  m: string
  /** parameters */
  a: any[]
  /** id */
  i: string
}

export class RemoteTransport<
  // events that will be called when this transport is envoked from the other side of the RPC
  M extends TransportMethods = {},
  // events that will be called on the other side of the RPC, only used in types
  E extends TransportMethods = {},
> {
  private readonly _rpcPromises = new Map<
    string,
    {
      resolve: (data: any) => void
      reject: (data: any) => void
      timeoutId?: any
    }
  >()

  constructor(private readonly _options: TransportOptions<M>) {
    this._options.onMessage(async (_data) => {
      if (typeof _data !== 'object' || !_data || !_data.__v) return

      const data = _data as RequestEvent | ResponseEvent

      if (data.__v === 'q') {
        await this._resolveRequest(data)
      } else {
        await this._resolveResponse(data)
      }
    })
  }

  invoke<K extends string & keyof E>(
    method: K,
    ...args: Parameters<E[K]>
  ): Promise<ReturnType<E[K]>> {
    const promiseId = nanoid()
    this._sendRequest({
      m: method,
      a: args,
      i: promiseId,
    })
    return new Promise((resolve, reject) => {
      const timeout = this._options.timeout ?? 60000
      let timeoutId
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this._rpcPromises.delete(promiseId)
          reject(new Error(`${method} timed out after ${timeout}ms`))
        }, timeout)
        timeoutId?.unref?.()
      }
      this._rpcPromises.set(promiseId, { resolve, reject, timeoutId })
    })
  }

  private async _resolveResponse(data: ResponseEvent) {
    const promise = this._rpcPromises.get(data.i)
    if (!promise) return

    if (promise.timeoutId) clearTimeout(promise.timeoutId)

    this._rpcPromises.delete(data.i)

    if (data.e) {
      promise.reject(data.e)
    } else {
      promise.resolve(data.r)
    }
  }

  private async _resolveRequest(data: RequestEvent) {
    const method = data.m
    const parameters = data.a
    try {
      if (!(method in this._options.methods)) {
        throw new Error(`Method not found: ${method}`)
      }

      const result = await this._options.methods[method](...parameters)
      this._sendResponse({
        r: result,
        i: data.i,
      })
    } catch (err: any) {
      this._sendResponse({
        e: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        i: data.i,
      })
    }
  }

  private _sendResponse(data: Omit<ResponseEvent, '__v'>) {
    this._options.send({ __v: 's', ...data })
  }

  private _sendRequest(data: Omit<RequestEvent, '__v'>) {
    this._options.send({ __v: 'q', ...data })
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
