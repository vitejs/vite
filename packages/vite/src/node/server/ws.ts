import path from 'node:path'
import type { IncomingMessage, Server } from 'node:http'
import { STATUS_CODES, createServer as createHttpServer } from 'node:http'
import type { ServerOptions as HttpsServerOptions } from 'node:https'
import { createServer as createHttpsServer } from 'node:https'
import type { Socket } from 'node:net'
import type { Duplex } from 'node:stream'
import crypto from 'node:crypto'
import colors from 'picocolors'
import type { WebSocket as WebSocketRaw } from 'ws'
import { WebSocketServer as WebSocketServerRaw_ } from 'ws'
import type { WebSocket as WebSocketTypes } from 'dep-types/ws'
import type { CustomPayload, ErrorPayload, HMRPayload } from 'types/hmrPayload'
import type { InferCustomEventPayload } from 'types/customEvent'
import type { ResolvedConfig } from '..'
import { isObject } from '../utils'
import type { HMRChannel } from './hmr'
import type { HttpServer } from '.'

/* In Bun, the `ws` module is overridden to hook into the native code. Using the bundled `js` version
 * of `ws` will not work as Bun's req.socket does not allow reading/writing to the underlying socket.
 */
const WebSocketServerRaw = process.versions.bun
  ? // @ts-expect-error: Bun defines `import.meta.require`
    import.meta.require('ws').WebSocketServer
  : WebSocketServerRaw_

export const HMR_HEADER = 'vite-hmr'

export type WebSocketCustomListener<T> = (
  data: T,
  client: WebSocketClient,
) => void

export interface WebSocketServer extends HMRChannel {
  /**
   * Listen on port and host
   */
  listen(): void
  /**
   * Get all connected clients.
   */
  clients: Set<WebSocketClient>
  /**
   * Disconnect all clients and terminate the server.
   */
  close(): Promise<void>
  /**
   * Handle custom event emitted by `import.meta.hot.send`
   */
  on: WebSocketTypes.Server['on'] & {
    <T extends string>(
      event: T,
      listener: WebSocketCustomListener<InferCustomEventPayload<T>>,
    ): void
  }
  /**
   * Unregister event listener.
   */
  off: WebSocketTypes.Server['off'] & {
    (event: string, listener: Function): void
  }
}

export interface WebSocketClient {
  /**
   * Send event to the client
   */
  send(payload: HMRPayload): void
  /**
   * Send custom event
   */
  send(event: string, payload?: CustomPayload['data']): void
  /**
   * The raw WebSocket instance
   * @advanced
   */
  socket: WebSocketTypes
}

const wsServerEvents = [
  'connection',
  'error',
  'headers',
  'listening',
  'message',
]

function noop() {
  // noop
}

// we only allow websockets to be connected if it has a valid token
// this is to prevent untrusted origins to connect to the server
// for example, Cross-site WebSocket hijacking
//
// we should check the token before calling wss.handleUpgrade
// otherwise untrusted ws clients will be included in wss.clients
//
// using the query params means the token might be logged out in server or middleware logs
// but we assume that is not an issue since the token is regenerated for each process
function hasValidToken(config: ResolvedConfig, url: URL) {
  const token = url.searchParams.get('token')
  if (!token) return false

  try {
    const isValidToken = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(config.webSocketToken),
    )
    return isValidToken
  } catch {} // an error is thrown when the length is incorrect
  return false
}

export function createWebSocketServer(
  server: HttpServer | null,
  config: ResolvedConfig,
  httpsOptions?: HttpsServerOptions,
): WebSocketServer {
  if (config.server.ws === false) {
    return {
      name: 'ws',
      get clients() {
        return new Set<WebSocketClient>()
      },
      async close() {
        // noop
      },
      on: noop as any as WebSocketServer['on'],
      off: noop as any as WebSocketServer['off'],
      listen: noop,
      send: noop,
    }
  }

  let wsHttpServer: Server | undefined = undefined

  const hmr = isObject(config.server.hmr) && config.server.hmr
  const hmrServer = hmr && hmr.server
  const hmrPort = hmr && hmr.port
  // TODO: the main server port may not have been chosen yet as it may use the next available
  const portsAreCompatible = !hmrPort || hmrPort === config.server.port
  const wsServer = hmrServer || (portsAreCompatible && server)
  let hmrServerWsListener: (
    req: InstanceType<typeof IncomingMessage>,
    socket: Duplex,
    head: Buffer,
  ) => void
  const customListeners = new Map<string, Set<WebSocketCustomListener<any>>>()
  const clientsMap = new WeakMap<WebSocketRaw, WebSocketClient>()
  const port = hmrPort || 24678
  const host = (hmr && hmr.host) || undefined

  const shouldHandle = (req: IncomingMessage) => {
    if (config.legacy?.skipWebSocketTokenCheck) {
      return true
    }

    // If the Origin header is set, this request might be coming from a browser.
    // Browsers always sets the Origin header for WebSocket connections.
    if (req.headers.origin) {
      const parsedUrl = new URL(`http://example.com${req.url!}`)
      return hasValidToken(config, parsedUrl)
    }

    // We allow non-browser requests to connect without a token
    // for backward compat and convenience
    // This is fine because if you can sent a request without the SOP limitation,
    // you can also send a normal HTTP request to the server.
    return true
  }
  const handleUpgrade = (
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
    _isPing: boolean,
  ) => {
    wss.handleUpgrade(req, socket as Socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  }
  const wss: WebSocketServerRaw_ = new WebSocketServerRaw({ noServer: true })
  wss.shouldHandle = shouldHandle

  if (wsServer) {
    let hmrBase = config.base
    const hmrPath = hmr ? hmr.path : undefined
    if (hmrPath) {
      hmrBase = path.posix.join(hmrBase, hmrPath)
    }
    hmrServerWsListener = (req, socket, head) => {
      const parsedUrl = new URL(`http://example.com${req.url!}`)
      if (
        req.headers['sec-websocket-protocol'] === HMR_HEADER &&
        parsedUrl.pathname === hmrBase
      ) {
        handleUpgrade(req, socket as Socket, head, false)
      }
    }
    wsServer.on('upgrade', hmrServerWsListener)
  } else {
    // http server request handler keeps the same with
    // https://github.com/websockets/ws/blob/45e17acea791d865df6b255a55182e9c42e5877a/lib/websocket-server.js#L88-L96
    const route = ((_, res) => {
      const statusCode = 426
      const body = STATUS_CODES[statusCode]
      if (!body)
        throw new Error(`No body text found for the ${statusCode} status code`)

      res.writeHead(statusCode, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain',
      })
      res.end(body)
    }) as Parameters<typeof createHttpServer>[1]
    if (httpsOptions) {
      wsHttpServer = createHttpsServer(httpsOptions, route)
    } else {
      wsHttpServer = createHttpServer(route)
    }
    wsHttpServer.on('upgrade', (req, socket, head) => {
      handleUpgrade(req, socket as Socket, head, false)
    })
    wsHttpServer.on('error', (e: Error & { code: string }) => {
      if (e.code === 'EADDRINUSE') {
        config.logger.error(
          colors.red(`WebSocket server error: Port is already in use`),
          { error: e },
        )
      } else {
        config.logger.error(
          colors.red(`WebSocket server error:\n${e.stack || e.message}`),
          { error: e },
        )
      }
    })
  }

  wss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      if (!customListeners.size) return
      let parsed: any
      try {
        parsed = JSON.parse(String(raw))
      } catch {}
      if (!parsed || parsed.type !== 'custom' || !parsed.event) return
      const listeners = customListeners.get(parsed.event)
      if (!listeners?.size) return
      const client = getSocketClient(socket)
      listeners.forEach((listener) => listener(parsed.data, client))
    })
    socket.on('error', (err) => {
      config.logger.error(`${colors.red(`ws error:`)}\n${err.stack}`, {
        timestamp: true,
        error: err,
      })
    })
    socket.send(JSON.stringify({ type: 'connected' }))
    if (bufferedError) {
      socket.send(JSON.stringify(bufferedError))
      bufferedError = null
    }
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code === 'EADDRINUSE') {
      config.logger.error(
        colors.red(`WebSocket server error: Port is already in use`),
        { error: e },
      )
    } else {
      config.logger.error(
        colors.red(`WebSocket server error:\n${e.stack || e.message}`),
        { error: e },
      )
    }
  })

  // Provide a wrapper to the ws client so we can send messages in JSON format
  // To be consistent with server.ws.send
  function getSocketClient(socket: WebSocketRaw) {
    if (!clientsMap.has(socket)) {
      clientsMap.set(socket, {
        send: (...args) => {
          let payload: HMRPayload
          if (typeof args[0] === 'string') {
            payload = {
              type: 'custom',
              event: args[0],
              data: args[1],
            }
          } else {
            payload = args[0]
          }
          socket.send(JSON.stringify(payload))
        },
        socket,
      })
    }
    return clientsMap.get(socket)!
  }

  // On page reloads, if a file fails to compile and returns 500, the server
  // sends the error payload before the client connection is established.
  // If we have no open clients, buffer the error and send it to the next
  // connected client.
  let bufferedError: ErrorPayload | null = null

  return {
    name: 'ws',
    listen: () => {
      wsHttpServer?.listen(port, host)
    },
    on: ((event: string, fn: () => void) => {
      if (wsServerEvents.includes(event)) wss.on(event, fn)
      else {
        if (!customListeners.has(event)) {
          customListeners.set(event, new Set())
        }
        customListeners.get(event)!.add(fn)
      }
    }) as WebSocketServer['on'],
    off: ((event: string, fn: () => void) => {
      if (wsServerEvents.includes(event)) {
        wss.off(event, fn)
      } else {
        customListeners.get(event)?.delete(fn)
      }
    }) as WebSocketServer['off'],

    get clients() {
      return new Set(Array.from(wss.clients).map(getSocketClient))
    },

    send(...args: any[]) {
      let payload: HMRPayload
      if (typeof args[0] === 'string') {
        payload = {
          type: 'custom',
          event: args[0],
          data: args[1],
        }
      } else {
        payload = args[0]
      }

      if (payload.type === 'error' && !wss.clients.size) {
        bufferedError = payload
        return
      }

      const stringified = JSON.stringify(payload)
      wss.clients.forEach((client) => {
        // readyState 1 means the connection is open
        if (client.readyState === 1) {
          client.send(stringified)
        }
      })
    },

    close() {
      // should remove listener if hmr.server is set
      // otherwise the old listener swallows all WebSocket connections
      if (hmrServerWsListener && wsServer) {
        wsServer.off('upgrade', hmrServerWsListener)
      }
      return new Promise((resolve, reject) => {
        wss.clients.forEach((client) => {
          client.terminate()
        })
        wss.close((err) => {
          if (err) {
            reject(err)
          } else {
            if (wsHttpServer) {
              wsHttpServer.close((err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve()
                }
              })
            } else {
              resolve()
            }
          }
        })
      })
    },
  }
}
