import colors from 'picocolors'
import type { Server } from 'http'
import { STATUS_CODES } from 'http'
import type { ServerOptions as HttpsServerOptions } from 'https'
import { createServer as createHttpsServer } from 'https'
import type { ServerOptions, WebSocket as WebSocketRaw } from 'ws'
import { WebSocketServer as WebSocketServerRaw } from 'ws'
import type { ErrorPayload, HMRPayload } from 'types/hmrPayload'
import type { ResolvedConfig } from '..'
import { isObject } from '../utils'
import type { Socket } from 'net'
export const HMR_HEADER = 'vite-hmr'

export type WebSocketCustomListener<T> = (
  data: T,
  client: WebSocketClient
) => void

export interface WebSocketServer {
  /**
   * Get all connected clients.
   */
  clients: Set<WebSocketClient>
  /**
   * Boardcast events to all clients
   */
  send(payload: HMRPayload): void
  /**
   * Disconnect all clients and terminate the server.
   */
  close(): Promise<void>
  /**
   * Handle custom event emitted by `import.meta.hot.send`
   */
  onMessage<T>(event: string, listener: WebSocketCustomListener<T>): () => void
  /**
   * Listen to raw events from the WebSocket server.
   * @advanced
   */
  on: WebSocketServerRaw['on']
  /**
   * Unregister listeners for raw WebSocket server events.
   * @advanced
   */
  off: WebSocketServerRaw['off']
}

export interface WebSocketClient {
  /**
   * Send event to the client
   */
  send(payload: HMRPayload): void
  /**
   * The raw WebSocket instance
   * @advanced
   */
  socket: WebSocketRaw
}

export function createWebSocketServer(
  server: Server | null,
  config: ResolvedConfig,
  httpsOptions?: HttpsServerOptions
): WebSocketServer {
  let wss: WebSocketServerRaw
  let httpsServer: Server | undefined = undefined

  const hmr = isObject(config.server.hmr) && config.server.hmr
  const hmrServer = hmr && hmr.server
  const hmrPort = hmr && hmr.port
  // TODO: the main server port may not have been chosen yet as it may use the next available
  const portsAreCompatible = !hmrPort || hmrPort === config.server.port
  const wsServer = hmrServer || (portsAreCompatible && server)
  const customListeners = new Map<string, Set<WebSocketCustomListener<any>>>()
  const clientsMap = new WeakMap<WebSocketRaw, WebSocketClient>()

  if (wsServer) {
    wss = new WebSocketServerRaw({ noServer: true })
    wsServer.on('upgrade', (req, socket, head) => {
      if (req.headers['sec-websocket-protocol'] === HMR_HEADER) {
        wss.handleUpgrade(req, socket as Socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  } else {
    const websocketServerOptions: ServerOptions = {}
    const port = hmrPort || 24678
    const host = (hmr && hmr.host) || undefined
    if (httpsOptions) {
      // if we're serving the middlewares over https, the ws library doesn't support automatically creating an https server, so we need to do it ourselves
      // create an inline https server and mount the websocket server to it
      httpsServer = createHttpsServer(httpsOptions, (req, res) => {
        const statusCode = 426
        const body = STATUS_CODES[statusCode]
        if (!body)
          throw new Error(
            `No body text found for the ${statusCode} status code`
          )

        res.writeHead(statusCode, {
          'Content-Length': body.length,
          'Content-Type': 'text/plain'
        })
        res.end(body)
      })

      httpsServer.listen(port, host)
      websocketServerOptions.server = httpsServer
    } else {
      // we don't need to serve over https, just let ws handle its own server
      websocketServerOptions.port = port
      if (host) {
        websocketServerOptions.host = host
      }
    }

    // vite dev server in middleware mode
    wss = new WebSocketServerRaw(websocketServerOptions)
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
      const client = getSocketClent(socket)
      listeners.forEach((listener) => listener(parsed.data, client))
    })
    socket.send(JSON.stringify({ type: 'connected' }))
    if (bufferedError) {
      socket.send(JSON.stringify(bufferedError))
      bufferedError = null
    }
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      config.logger.error(
        colors.red(`WebSocket server error:\n${e.stack || e.message}`),
        { error: e }
      )
    }
  })

  // Provide a wrapper to the ws client so we can send messages in JSON format
  // To be consistent with server.ws.send
  function getSocketClent(socket: WebSocketRaw) {
    if (!clientsMap.has(socket)) {
      clientsMap.set(socket, {
        send: (payload) => socket.send(JSON.stringify(payload)),
        socket
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
    get on() {
      return wss.on.bind(wss)
    },
    get off() {
      return wss.off.bind(wss)
    },
    get clients() {
      return new Set(Array.from(wss.clients).map(getSocketClent))
    },

    send(payload: HMRPayload) {
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
      return new Promise((resolve, reject) => {
        wss.clients.forEach((client) => {
          client.terminate()
        })
        wss.close((err) => {
          if (err) {
            reject(err)
          } else {
            if (httpsServer) {
              httpsServer.close((err) => {
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

    onMessage<T>(event: string, listener: WebSocketCustomListener<T>) {
      if (!customListeners.has(event)) customListeners.set(event, new Set())
      customListeners.get(event)!.add(listener)

      const off = () => {
        customListeners.get(event)?.delete(listener)
      }
      return off
    }
  }
}
