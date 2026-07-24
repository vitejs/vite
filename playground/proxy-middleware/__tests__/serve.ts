// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import http from 'node:http'
import crypto from 'node:crypto'
import type { AddressInfo } from 'node:net'
import { ports, rootDir, setViteUrl } from '~utils'

// Stores the Origin header seen by the backend WS server for verification.
let lastWsOrigin: string | undefined

// --- backend HTTP server for web proxy tests ---
const backend = http.createServer((req, res) => {
  const url = req.url!

  if (url === '/echo-headers') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(req.headers))
    return
  }

  if (url === '/slow') {
    // Respond slowly so the client can abort mid-response, triggering
    // the `proxyRes` close cleanup path in the proxy middleware.
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    })
    res.write('first chunk\n')
    setTimeout(() => {
      res.write('second chunk\n')
      res.end()
    }, 2000)
    return
  }

  if (url === '/big') {
    // Send a large response body (1 MB) so the client receives it in
    // multiple chunks, exercising the full piping path through http-proxy-3.
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    const chunk = 'x'.repeat(64 * 1024) // 64 KB
    for (let i = 0; i < 16; i++) {
      res.write(chunk)
    }
    res.end()
    return
  }

  if (url === '/status-204') {
    res.writeHead(204)
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`backend:${url}`)
})

// --- backend WebSocket server (manual handshake) for ws proxy tests ---
backend.on('upgrade', (req, socket, _head) => {
  // Capture the Origin header so tests can verify rewriteWsOrigin behavior.
  lastWsOrigin = req.headers.origin

  // Minimal RFC 6455 handshake — no ws library needed.
  const key = req.headers['sec-websocket-key'] as string
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64')

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      '\r\n',
  )

  // Send a simple text frame with the origin we received.
  const payload = Buffer.from(`ws-origin:${lastWsOrigin ?? 'none'}`)
  const frame = Buffer.alloc(2 + payload.length)
  frame[0] = 0x81 // FIN + text frame
  frame[1] = payload.length // assume < 126 bytes
  payload.copy(frame, 2)
  socket.write(frame)
  // Keep the socket open briefly to ensure the data is piped through
  // the proxy before closing. The proxy's pipe will handle cleanup.
  setTimeout(() => socket.end(), 1000)
})

export async function serve(): Promise<{ close(): Promise<void> }> {
  const vite = await import('vite')

  await new Promise<void>((resolve) => backend.listen(0, '127.0.0.1', resolve))
  const backendPort = (backend.address() as AddressInfo).port
  const backendUrl = `http://127.0.0.1:${backendPort}`
  const backendWsUrl = `ws://127.0.0.1:${backendPort}`

  const server = await vite.createServer({
    root: rootDir,
    logLevel: 'silent',
    server: {
      port: ports['proxy-middleware'],
      proxy: {
        // basic proxying — verifies the core web() path works
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        // proxy with path rewrite
        '/rewrite': {
          target: backendUrl,
          rewrite: (path) => path.replace(/^\/rewrite/, '/api'),
        },
        // proxy that forwards custom headers to the backend
        '/headers': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/headers/, ''),
          headers: {
            'x-injected': 'injected-value',
          },
        },
        // proxy returning a large body (full pipe path)
        '/big': {
          target: backendUrl,
        },
        // proxy to a slow endpoint — used for abort / cleanup test
        '/slow': {
          target: backendUrl,
        },
        // proxy to a non-existent host — triggers the error handler → 502
        '/error': {
          target: 'http://127.0.0.1:1', // port 1 should always fail
        },
        // proxy to a 204 response
        '/no-content': {
          target: backendUrl,
          rewrite: (path) => path.replace(/^\/no-content/, '/status-204'),
        },
        // ws proxy with rewriteWsOrigin — rewrites the Origin header to
        // match the target URL
        '/ws-origin': {
          target: backendWsUrl,
          ws: true,
          rewriteWsOrigin: true,
        },
        // proxy with auth — verifies that the configured auth overrides
        // any Authorization header sent by the client (fixes #20312)
        '/auth': {
          target: backendUrl,
          rewrite: (path) => path.replace(/^\/auth/, ''),
          auth: 'user1:pass1',
        },
      },
    },
  })

  await server.listen()
  const viteUrl = server.resolvedUrls.local[0].replace(/\/$/, '')
  setViteUrl(viteUrl)

  return {
    async close() {
      await server.close()
      await new Promise<void>((resolve) => backend.close(() => resolve()))
    },
  }
}
