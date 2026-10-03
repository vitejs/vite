import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, test } from 'vitest'
import WebSocket from 'ws'
import { createServer } from '..'
import type { ViteDevServer } from '..'
import type { ErrorPayload } from '#types/hmrPayload'

const optimizeDeps = {
  noDiscovery: true,
  include: [],
}

describe('websocket server', () => {
  let server: ViteDevServer | undefined
  const sockets: WebSocket[] = []

  afterEach(async () => {
    for (const socket of sockets) {
      socket.close()
    }
    sockets.length = 0
    await server?.close()
    server = undefined
  })

  function connectHmrClient() {
    const address = server!.httpServer!.address() as AddressInfo
    const token = server!.config.webSocketToken
    const socket = new WebSocket(
      `ws://localhost:${address.port}/?token=${token}`,
      ['vite-hmr'],
    )
    sockets.push(socket)

    return socket
  }

  function waitForPayload(socket: WebSocket, type: string) {
    return new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('error', onError)
        socket.off('message', onMessage)
        reject(new Error(`Timed out waiting for ${type} payload`))
      }, 1000)

      function onError(error: Error) {
        clearTimeout(timeout)
        socket.off('message', onMessage)
        reject(error)
      }

      function onMessage(raw: WebSocket.RawData) {
        const payload = JSON.parse(String(raw))
        if (payload.type === type) {
          clearTimeout(timeout)
          socket.off('error', onError)
          socket.off('message', onMessage)
          resolve(payload)
        }
      }

      socket.on('error', onError)
      socket.on('message', onMessage)
    })
  }

  test('sends the current error payload to clients that connect later', async () => {
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'silent',
      optimizeDeps,
      server: {
        port: 0,
        strictPort: true,
      },
    })
    await server.listen()

    const firstClient = connectHmrClient()
    await waitForPayload(firstClient, 'connected')

    const payload: ErrorPayload = {
      type: 'error',
      err: {
        message: 'Unexpected token',
        stack: 'Error: Unexpected token',
      },
    }

    const firstError = waitForPayload(firstClient, 'error')
    server.ws.send(payload)
    await expect(firstError).resolves.toMatchObject(payload)

    const secondClient = connectHmrClient()
    const secondError = waitForPayload(secondClient, 'error')
    await waitForPayload(secondClient, 'connected')

    await expect(secondError).resolves.toMatchObject(payload)
  })
})
