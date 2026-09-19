import net from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { type ViteDevServer, createServer } from '../index'

// Crafts a minimal HTTP upgrade request that triggers vite's WS upgrade
// handler. Uses the `vite-ping` subprotocol which bypasses the token check.
function upgradeRequest(host: string): string {
  return (
    `GET / HTTP/1.1\r\n` +
    `Host: ${host}\r\n` +
    `Upgrade: websocket\r\n` +
    `Connection: Upgrade\r\n` +
    `Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n` +
    `Sec-WebSocket-Version: 13\r\n` +
    `Sec-WebSocket-Protocol: vite-ping\r\n` +
    `\r\n`
  )
}

describe('WS upgrade error handling', () => {
  let server: ViteDevServer | undefined

  afterEach(async () => {
    if (server) {
      await server.close()
      server = undefined
    }
  })

  // Regression test for the dev-server-crash class of bugs where a client
  // RSTs the TCP connection during the WS upgrade handshake. Before the fix,
  // the raw socket had no 'error' listener until the ws library attached its
  // own — any error in that window propagated as an unhandled 'error' event
  // and aborted the Node process with:
  //
  //   Error: read ECONNRESET
  //       at TCP.onStreamRead (node:internal/stream_base_commons:216:20)
  //   Emitted 'error' event on Socket instance at ...
  //
  // The fix attaches an error listener on the raw socket before calling
  // wss.handleUpgrade. We assert that by counting socket.on('error', ...)
  // calls: with the fix, vite attaches one; the ws library then attaches its
  // own as part of handleUpgrade, so the count must be at least 2.
  it("attaches an 'error' listener on the upgrade socket before ws takes over", async () => {
    server = await createServer({
      configFile: false,
      server: { port: 0, host: '127.0.0.1' },
    })
    await server.listen()
    const httpServer = server.httpServer!
    const port = (httpServer.address() as AddressInfo).port

    // Capture the upgrade socket so we can inspect its listeners after
    // vite's upgrade listener (and wss.handleUpgrade) have run.
    let upgradeSocket: import('node:stream').Duplex | null = null
    httpServer.on('upgrade', (_req, socket) => {
      upgradeSocket = socket
    })

    const sock = net.connect(port, '127.0.0.1')
    await new Promise<void>((resolve, reject) => {
      sock.once('connect', () => resolve())
      sock.once('error', reject)
    })
    sock.write(upgradeRequest(`127.0.0.1:${port}`))

    await new Promise((r) => setTimeout(r, 50))

    // The ws library always attaches one error listener inside handleUpgrade.
    // Vite's fix adds another before delegating. So with the fix, the socket
    // has at least 2 'error' listeners; without it, only 1.
    expect(upgradeSocket).not.toBeNull()
    expect(upgradeSocket!.listenerCount('error')).toBeGreaterThanOrEqual(2)
    sock.destroy()
  })
})
