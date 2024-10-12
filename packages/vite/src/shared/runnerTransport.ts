import { nanoid } from 'nanoid/non-secure'
import type { CustomPayload, HotPayload } from 'types/hmrPayload'
import { promiseWithResolvers } from './utils'

export type RunnerTransportHandlers = {
  onDisconnection: () => void
}

export type CreateRunnerTransport = (
  handlers: RunnerTransportHandlers,
) => RunnerTransportOptions

/**
 * "send and connect" or "invoke" must be implemented
 */
export interface RunnerTransportOptions {
  connect?(handler: (data: HotPayload) => void): Promise<void> | void
  disconnect?(): Promise<void> | void
  send?(data: HotPayload): void
  invoke?(data: HotPayload): any
  timeout?: number
}

type NormalizedRunnerTransportOptions = Omit<
  RunnerTransportOptions,
  'send' | 'invoke'
> & {
  connect?(
    handler: ((data: HotPayload) => void) | undefined,
  ): Promise<void> | void
  send(data: HotPayload): void
  invoke(name: string, data: any): any
}

const createInvokeableTransportOptions = (
  transport: RunnerTransportOptions,
): NormalizedRunnerTransportOptions => {
  if (transport.invoke) {
    const sendOrInvoke = transport.send ?? transport.invoke
    return {
      ...transport,
      send(data) {
        sendOrInvoke(data)
      },
      invoke(name, data) {
        return transport.invoke!({
          type: 'custom',
          event: name,
          invoke: 'send',
          data,
        } satisfies CustomPayload)
      },
    }
  }

  if (!transport.send || !transport.connect) {
    throw new Error(
      'transport must implement send and connect when invoke is not implemented',
    )
  }

  const rpcPromises = new Map<
    string,
    {
      resolve: (data: any) => void
      reject: (data: any) => void
      timeoutId?: ReturnType<typeof setTimeout>
    }
  >()

  return {
    ...transport,
    connect(handler) {
      transport.connect!((data) => {
        if (
          data.type === 'custom' &&
          data.invoke &&
          data.invoke.startsWith('response:')
        ) {
          const invokeId = data.invoke.slice('response:'.length)
          const promise = rpcPromises.get(invokeId)
          if (!promise) return

          if (promise.timeoutId) clearTimeout(promise.timeoutId)

          rpcPromises.delete(invokeId)

          const { e, r } = data.data
          if (e) {
            promise.reject(e)
          } else {
            promise.resolve(r)
          }
          return
        }
        handler?.(data)
      })
    },
    send(data) {
      transport.send!(data)
    },
    async invoke(name, data) {
      const promiseId = nanoid()
      const wrappedData: CustomPayload = {
        type: 'custom',
        event: name,
        invoke: `send:${promiseId}`,
        data,
      }
      transport.send!(wrappedData)

      const { promise, resolve, reject } = promiseWithResolvers<any>()
      const timeout = transport.timeout ?? 60000
      let timeoutId
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          rpcPromises.delete(promiseId)
          reject(
            new Error(
              `transport invoke timed out after ${timeout}ms (data: ${JSON.stringify(wrappedData)})`,
            ),
          )
        }, timeout)
        timeoutId?.unref?.()
      }
      rpcPromises.set(promiseId, { resolve, reject, timeoutId })

      return await promise
    },
  }
}

export interface RunnerTransport {
  connect?(
    handler: ((data: HotPayload) => void) | undefined,
  ): Promise<void> | void
  disconnect?(): Promise<void> | void
  send(data: HotPayload): void
  invoke(name: string, data: any): any
}

export const createRunnerTransport = (
  createTransport: CreateRunnerTransport,
): RunnerTransport => {
  let previousHandler: ((data: any) => void) | undefined
  let connectingPromise: Promise<void> | undefined

  const connect = async (handler: ((data: any) => void) | undefined) => {
    previousHandler = handler
    if (isConnected) return
    if (connectingPromise) {
      await connectingPromise
      return
    }

    if (invokeableTransport.connect) {
      const maybePromise = invokeableTransport.connect(previousHandler)
      if (maybePromise) {
        connectingPromise = maybePromise
        await connectingPromise
        connectingPromise = undefined
      }
    }
    isConnected = true
  }

  const onDisconnection = () => {
    isConnected = false
  }

  const transport = createTransport({ onDisconnection })
  const invokeableTransport = createInvokeableTransportOptions(transport)

  let isConnected = !invokeableTransport.connect

  const normalizedTransport = {
    ...invokeableTransport,
    ...(invokeableTransport.connect
      ? {
          connect,
          async disconnect() {
            if (!isConnected) return
            if (connectingPromise) {
              await connectingPromise
            }
            isConnected = false
            await invokeableTransport.disconnect?.()
          },
        }
      : {}),
    async send(data) {
      if (!isConnected) {
        if (connectingPromise) {
          await connectingPromise
        } else {
          throw new Error('send was called before connect')
        }
      }
      invokeableTransport.send(data)
    },
    async invoke(name, data) {
      if (!isConnected) {
        if (connectingPromise) {
          await connectingPromise
        } else {
          throw new Error('invoke was called before connect')
        }
      }
      return invokeableTransport.invoke(name, data)
    },
  } as const satisfies NormalizedRunnerTransportOptions

  return normalizedTransport
}

export const createWebSocketRunnerTransportOptions =
  (options: {
    protocol: string
    hostAndPort: string
    pingInterval?: number
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    WebSocket?: typeof WebSocket
  }) =>
  ({
    onDisconnection,
  }: RunnerTransportHandlers): Required<
    Pick<RunnerTransportOptions, 'connect' | 'disconnect' | 'send'>
  > => {
    const pingInterval = options.pingInterval ?? 30000
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const WebSocket = options.WebSocket || globalThis.WebSocket
    if (!WebSocket) {
      throw new Error('WebSocket is not supported in this environment.')
    }
    const url = `${options.protocol}://${options.hostAndPort}`

    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    let ws: WebSocket | undefined
    let pingIntervalId: ReturnType<typeof setInterval> | undefined
    return {
      async connect(handler) {
        const socket = new WebSocket(url, 'vite-hmr')
        socket.addEventListener('message', async ({ data }) => {
          handler(JSON.parse(data))
        })

        await new Promise<void>((resolve, reject) => {
          let isOpened = false
          socket.addEventListener(
            'open',
            () => {
              isOpened = true
              handler({
                type: 'custom',
                event: 'vite:ws:connect',
                data: { webSocket: socket },
              })
              resolve()
            },
            { once: true },
          )

          socket.addEventListener('close', async ({ wasClean }) => {
            if (wasClean) return

            if (!isOpened) {
              reject(new Error('WebSocket closed without opened.'))
              return
            }

            handler({
              type: 'custom',
              event: 'vite:ws:disconnect',
              data: { webSocket: socket },
            })
            onDisconnection()
          })
        })

        ws = socket

        // proxy(nginx, docker) hmr ws maybe caused timeout,
        // so send ping package let ws keep alive.
        pingIntervalId = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping')
          }
        }, pingInterval)
      },
      disconnect() {
        clearInterval(pingIntervalId)
        ws?.close()
      },
      send(data) {
        ws!.send(JSON.stringify(data))
      },
    }
  }
