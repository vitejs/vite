import { errorMonitor } from 'node:events'
import type { IncomingMessage } from 'node:http'
import type { Socket } from 'node:net'
import type { Duplex } from 'node:stream'
import { expect, test } from 'vitest'
import WebSocket from 'ws'
import { isServe, promiseWithResolvers, viteServer, viteTestUrl } from '~utils'

// https://github.com/vitejs/vite/issues/23727
test.runIf(isServe)(
  'does not crash when an unhandled upgrade request is reset',
  async () => {
    const httpServer = viteServer.httpServer!
    const upgrade = promiseWithResolvers<Duplex>()
    const onUpgrade = (request: IncomingMessage, socket: Duplex) => {
      if (request.url === '/unhandled-upgrade') {
        upgrade.resolve(socket)
      }
    }
    httpServer.on('upgrade', onUpgrade)

    const wsUrl = new URL('/unhandled-upgrade', viteTestUrl)
    wsUrl.protocol = 'ws:'
    let socket: Socket
    const client = new WebSocket(wsUrl, {
      finishRequest(request) {
        request.once('socket', (requestSocket) => {
          socket = requestSocket
        })
        request.end()
      },
    })
    // The connection is deliberately reset before the handshake completes.
    client.on('error', () => {})
    try {
      const serverSocket = await upgrade.promise
      const socketError = promiseWithResolvers<Error>()
      serverSocket.once(errorMonitor, socketError.resolve)
      socket!.resetAndDestroy()

      await expect(socketError.promise).resolves.toMatchObject({
        code: 'ECONNRESET',
      })
    } finally {
      httpServer.off('upgrade', onUpgrade)
      client.terminate()
    }
  },
)
