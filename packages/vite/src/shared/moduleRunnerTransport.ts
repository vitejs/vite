import { nanoid } from 'nanoid/non-secure'
import type { CustomPayload, HotPayload } from 'types/hmrPayload'
import { promiseWithResolvers } from './utils'

export type ModuleRunnerTransportHandlers = {
  onMessage: (data: HotPayload) => void
  onDisconnection: () => void
}

/**
 * "send and connect" or "invoke" must be implemented
 */
export interface ModuleRunnerTransport {
  connect?(handlers: ModuleRunnerTransportHandlers): Promise<void> | void
  disconnect?(): Promise<void> | void
  send?(data: HotPayload): Promise<void> | void
  invoke?(
    data: HotPayload,
  ): Promise<{ /** result */ r: any } | { /** error */ e: any }>
  timeout?: number
}

type InvokeableModuleRunnerTransport = Omit<ModuleRunnerTransport, 'invoke'> &
  Required<Pick<ModuleRunnerTransport, 'send'>> & {
    invoke(name: string, data: any): any
  }

const createInvokeableTransport = (
  transport: ModuleRunnerTransport,
): InvokeableModuleRunnerTransport => {
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
      name: string
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
    disconnect() {
      rpcPromises.forEach((promise) => {
        promise.reject(
          new Error(
            `transport was disconnected, cannot call ${JSON.stringify(promise.name)}`,
          ),
        )
      })
      rpcPromises.clear()
      transport.disconnect?.()
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
      rpcPromises.set(promiseId, { resolve, reject, name, timeoutId })

      return await promise
    },
  }
}

export interface NormalizedModuleRunnerTransport {
  connect?(onMessage?: (data: HotPayload) => void): Promise<void> | void
  disconnect?(): Promise<void> | void
  send(data: HotPayload): void
  invoke(name: string, data: any): any
}

export const normalizeModuleRunnerTransport = (
  transport: ModuleRunnerTransport,
): NormalizedModuleRunnerTransport => {
  const invokeableTransport = createInvokeableTransport(transport)

  let isConnected = !invokeableTransport.connect
  let connectingPromise: Promise<void> | undefined

  return {
    ...(transport as Omit<ModuleRunnerTransport, 'connect'>),
    ...(invokeableTransport.connect
      ? {
          async connect(onMessage) {
            if (isConnected) return
            if (connectingPromise) {
              await connectingPromise
              return
            }

            const maybePromise = invokeableTransport.connect!({
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
            isConnected = true
          },
        }
      : {}),
    ...(invokeableTransport.disconnect
      ? {
          async disconnect() {
            if (!isConnected) return
            if (connectingPromise) {
              await connectingPromise
            }
            isConnected = false
            await invokeableTransport.disconnect!()
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

export const createWebSocketModuleRunnerTransport = (options: {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  createConnection: () => WebSocket
  pingInterval?: number
}): Required<
  Pick<ModuleRunnerTransport, 'connect' | 'disconnect' | 'send'>
> => {
  const pingInterval = options.pingInterval ?? 30000

  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  let ws: WebSocket | undefined
  let pingIntervalId: ReturnType<typeof setInterval> | undefined
  return {
    async connect({ onMessage, onDisconnection }) {
      const socket = options.createConnection()
      socket.addEventListener('message', async ({ data }) => {
        onMessage(JSON.parse(data))
      })

      let isOpened = socket.readyState === socket.OPEN
      if (!isOpened) {
        await new Promise<void>((resolve, reject) => {
          socket.addEventListener(
            'open',
            () => {
              isOpened = true
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
      }

      onMessage({
        type: 'custom',
        event: 'vite:ws:connect',
        data: { webSocket: socket },
      })
      ws = socket

      // proxy(nginx, docker) hmr ws maybe caused timeout,
      // so send ping package let ws keep alive.
      pingIntervalId = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
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
