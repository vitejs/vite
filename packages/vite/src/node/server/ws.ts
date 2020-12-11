import chalk from 'chalk'
import { Server } from 'http'
import WebSocket from 'ws'
import { HMRPayload } from '../../hmrPayload'

export const HMR_HEADER = 'vite-hmr'

export interface WebSocketServer {
  send(payload: HMRPayload): void
}

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocket.Server({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    if (req.headers['sec-websocket-protocol'] === HMR_HEADER) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    }
  })

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }))
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(chalk.red(`[vite] WebSocket server error:`))
      console.error(e)
    }
  })

  return {
    send(payload: HMRPayload) {
      const stringified = JSON.stringify(payload, null, 2)

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified)
        }
      })
    }
  }
}
