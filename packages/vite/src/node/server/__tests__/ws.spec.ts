import net from 'node:net'
import type { Duplex } from 'node:stream'
import { afterEach, describe, expect, test } from 'vitest'
import type { InlineConfig, ViteDevServer } from '../..'
import { createServer } from '../../server'

// `server.listen()` would otherwise start a dep scan that crawls every HTML fixture under `__tests__`
const optimizeDeps: InlineConfig['optimizeDeps'] = {
  noDiscovery: true,
  include: [],
}

describe('ws upgrade', () => {
  let viteServer: ViteDevServer | null = null

  afterEach(async () => {
    await viteServer?.close()
    viteServer = null
  })

  // https://github.com/vitejs/vite/issues/23727
  test('does not crash on a socket error for an upgrade request it does not handle', async () => {
    viteServer = await createServer({
      root: import.meta.dirname,
      optimizeDeps,
      logLevel: 'silent',
      server: { port: 0 },
    })
    await viteServer.listen()
    const { port } = viteServer.httpServer!.address() as net.AddressInfo

    const upgradeSocket = new Promise<Duplex>((resolve) => {
      viteServer!.httpServer!.once('upgrade', (_req, socket) => resolve(socket))
    })

    const client = net.connect(port, '127.0.0.1')
    try {
      await new Promise<void>((resolve) => client.once('connect', resolve))
      // no `Sec-WebSocket-Protocol`, so the HMR server does not take it over
      client.write(
        'GET / HTTP/1.1\r\n' +
          `Host: localhost:${port}\r\n` +
          'Upgrade: websocket\r\n' +
          'Connection: Upgrade\r\n' +
          'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
          'Sec-WebSocket-Version: 13\r\n' +
          '\r\n',
      )

      const socket = await upgradeSocket
      // a client reset (ECONNRESET) emits `error` on the socket; without a
      // listener, `emit` throws and the dev server process exits
      expect(() =>
        socket.emit(
          'error',
          Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
        ),
      ).not.toThrow()
    } finally {
      client.destroy()
    }
  })
})
