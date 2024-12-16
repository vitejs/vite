import { nanoid } from 'nanoid/non-secure'
import type { CustomPayload, HotPayload } from 'types/hmrPayload'
import { promiseWithResolvers } from './utils'
import type {
  InvokeMethods,
  InvokeResponseData,
  InvokeSendData,
} from './invokeMethods'

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
  invoke?(data: HotPayload): Promise<{ result: any } | { error: any }>
  timeout?: number
}

type InvokeableModuleRunnerTransport = Omit<ModuleRunnerTransport, 'invoke'> & {
  invoke<T extends keyof InvokeMethods>(
    name: T,
    data: Parameters<InvokeMethods[T]>,
  ): Promise<ReturnType<Awaited<InvokeMethods[T]>>>
}

function reviveInvokeError(e: any) {
  const error = new Error(e.message || 'Unknown invoke error')
  Object.assign(error, e, {
    // pass the whole error instead of just the stacktrace
    // so that it gets formatted nicely with console.log
    runnerError: new Error('RunnerError'),
  })
  return error
}

const createInvokeableTransport = (
  transport: ModuleRunnerTransport,
): InvokeableModuleRunnerTransport => {
  if (transport.invoke) {
    return {
      ...transport,
      async invoke(name, data) {
        const result = await transport.invoke!({
          type: 'custom',
          event: 'vite:invoke',
          data: {
            id: 'send',
            name,
            data,
          } satisfies InvokeSendData,
        } satisfies CustomPayload)
        if ('error' in result) {
          throw reviveInvokeError(result.error)
        }
        return result.result
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
      return transport.connect!({
        onMessage(payload) {
          if (payload.type === 'custom' && payload.event === 'vite:invoke') {
            const data = payload.data as InvokeResponseData
            if (data.id.startsWith('response:')) {
              const invokeId = data.id.slice('response:'.length)
              const promise = rpcPromises.get(invokeId)
              if (!promise) return

              if (promise.timeoutId) clearTimeout(promise.timeoutId)

              rpcPromises.delete(invokeId)

              const { error, result } = data.data
              if (error) {
                promise.reject(error)
              } else {
                promise.resolve(result)
              }
              return
            }
          }
          onMessage(payload)
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
      return transport.disconnect?.()
    },
    send(data) {
      return transport.send!(data)
    },
    async invoke<T extends keyof InvokeMethods>(
      name: T,
      data: Parameters<InvokeMethods[T]>,
    ) {
      const promiseId = nanoid()
      const wrappedData: CustomPayload = {
        type: 'custom',
        event: 'vite:invoke',
        data: {
          name,
          id: `send:${promiseId}`,
          data,
        } satisfies InvokeSendData,
      }
      const sendPromise = transport.send!(wrappedData)

      const { promise, resolve, reject } =
        promiseWithResolvers<ReturnType<Awaited<InvokeMethods[T]>>>()
      const timeout = transport.timeout ?? 60000
      let timeoutId: ReturnType<typeof setTimeout> | undefined
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

      if (sendPromise) {
        sendPromise.catch((err) => {
          clearTimeout(timeoutId)
          rpcPromises.delete(promiseId)
          reject(err)
        })
      }

      try {
        return await promise
      } catch (err) {
        throw reviveInvokeError(err)
      }
    },
  }
}

export interface NormalizedModuleRunnerTransport {
  connect?(onMessage?: (data: HotPayload) => void): Promise<void> | void
  disconnect?(): Promise<void> | void
  send(data: HotPayload): Promise<void>
  invoke<T extends keyof InvokeMethods>(
    name: T,
    data: Parameters<InvokeMethods[T]>,
  ): Promise<ReturnType<Awaited<InvokeMethods[T]>>>
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
      if (!invokeableTransport.send) return

      if (!isConnected) {
        if (connectingPromise) {
          await connectingPromise
        } else {
          throw new Error('send was called before connect')
        }
      }
      await invokeableTransport.send(data)
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
          socket.addEventListener('close', async () => {
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
