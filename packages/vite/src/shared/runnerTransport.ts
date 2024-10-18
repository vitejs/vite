import { nanoid } from 'nanoid/non-secure'
import type { CustomPayload, HotPayload } from 'types/hmrPayload'
import { promiseWithResolvers } from './utils'

export type RunnerTransportHandlers = {
  onMessage: (data: HotPayload) => void
  onDisconnection: () => void
}

/**
 * "send and connect" or "invoke" must be implemented
 */
export interface RunnerTransport {
  connect?(handlers: RunnerTransportHandlers): Promise<void> | void
  disconnect?(): Promise<void> | void
  send?(data: HotPayload): Promise<void> | void
  invoke?(
    data: HotPayload,
  ): Promise<{ /** result */ r: any } | { /** error */ e: any }>
  timeout?: number
}

type InvokeableRunnerTransport = Omit<RunnerTransport, 'send' | 'invoke'> & {
  connect?(handlers: RunnerTransportHandlers): Promise<void> | void
  send(data: HotPayload): void
  invoke(name: string, data: any): any
}

const createInvokeableTransport = (
  transport: RunnerTransport,
): InvokeableRunnerTransport => {
  if (transport.invoke) {
    const sendOrInvoke = transport.send ?? transport.invoke
    return {
      ...transport,
      async send(data) {
        await sendOrInvoke(data)
      },
      async invoke(name, data) {
        const result = await transport.invoke!({
          type: 'custom',
          event: name,
          invoke: 'send',
          data,
        } satisfies CustomPayload)
        if ('e' in result) {
          throw result.e
        }
        return result.r
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
    connect({ onMessage, onDisconnection }) {
      transport.connect!({
        onMessage(data) {
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
          onMessage(data)
        },
        onDisconnection,
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

export interface NormalizedRunnerTransport {
  connect?(onMessage?: (data: HotPayload) => void): Promise<void> | void
  disconnect?(): Promise<void> | void
  send(data: HotPayload): void
  invoke(name: string, data: any): any
}

export const normalizeRunnerTransport = (
  transport: RunnerTransport,
): NormalizedRunnerTransport => {
  const invokeableTransport = createInvokeableTransport(transport)

  let isConnected = !invokeableTransport.connect
  let connectingPromise: Promise<void> | undefined

  const connect = async (onMessage?: (data: HotPayload) => void) => {
    if (isConnected) return
    if (connectingPromise) {
      await connectingPromise
      return
    }

    if (invokeableTransport.connect) {
      const maybePromise = invokeableTransport.connect({
        onMessage: onMessage ?? (() => {}),
        onDisconnection() {
          isConnected = false
        },
      })
      if (maybePromise) {
        connectingPromise = maybePromise
        await connectingPromise
        connectingPromise = undefined
      }
    }
    isConnected = true
  }

  return {
    ...(invokeableTransport as Omit<
      InvokeableRunnerTransport,
      'connect' | 'send' | 'invoke'
    >),
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
  }
}

export const createWebSocketRunnerTransport = (options: {
  protocol: string
  hostAndPort: string
  pingInterval?: number
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  WebSocket?: typeof WebSocket
}): Required<Pick<RunnerTransport, 'connect' | 'disconnect' | 'send'>> => {
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
    async connect({ onMessage, onDisconnection }) {
      const socket = new WebSocket(url, 'vite-hmr')
      socket.addEventListener('message', async ({ data }) => {
        onMessage(JSON.parse(data))
      })

      await new Promise<void>((resolve, reject) => {
        let isOpened = false
        socket.addEventListener(
          'open',
          () => {
            isOpened = true
            onMessage({
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

          onMessage({
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
