import http from 'node:http'
import crypto from 'node:crypto'
import { URL } from 'node:url'
import { expect, test } from 'vitest'
import { viteTestUrl } from '~utils'

/**
 * Sends a raw WebSocket upgrade request with custom headers and reads
 * the first text frame from the server response.
 */
function sendWsUpgrade(
  serverUrl: string,
  path: string,
  headers: Record<string, string>,
): Promise<string> {
  const url = new URL(serverUrl)
  const key = crypto.randomBytes(16).toString('base64')

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path,
      method: 'GET',
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': key,
        ...headers,
      },
    })

    const timeout = setTimeout(
      () => reject(new Error('ws upgrade timeout')),
      5000,
    )

    req.on('upgrade', (_res, socket) => {
      clearTimeout(timeout)
      // Read the first WebSocket frame from the upgraded socket.
      socket.once('data', (data) => {
        // Frame format: byte 0 = opcode, byte 1 = payload length (assume < 126)
        const payloadLen = data[1] & 0x7f
        const payload = data.subarray(2, 2 + payloadLen).toString()
        socket.destroy()
        resolve(payload)
      })
    })

    req.on('response', (res) => {
      clearTimeout(timeout)
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () =>
        reject(
          new Error(
            `got HTTP ${res.statusCode} instead of upgrade: ${body.slice(0, 200)}`,
          ),
        ),
      )
    })

    req.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    req.end()
  })
}

test('proxies basic GET request', async () => {
  const res = await fetch(viteTestUrl + '/api/test')
  expect(res.status).toBe(200)
  const text = await res.text()
  expect(text).toBe('backend:/api/test')
})

test('rewrites the path', async () => {
  const res = await fetch(viteTestUrl + '/rewrite/foo')
  expect(res.status).toBe(200)
  const text = await res.text()
  // rewrite replaces /rewrite with /api, so backend sees /api/foo
  expect(text).toBe('backend:/api/foo')
})

test('injects custom headers', async () => {
  const res = await fetch(viteTestUrl + '/headers/echo-headers')
  expect(res.status).toBe(200)
  const headers = (await res.json()) as Record<string, string>
  // header names are lowercased by Node.js
  expect(headers['x-injected']).toBe('injected-value')
})

test('proxy auth overrides client Authorization header', async () => {
  // When the proxy is configured with `auth`, the configured credentials
  // should override any Authorization header sent by the client.
  // This is a regression test for #20312, fixed by http-proxy-3.
  const res = await fetch(viteTestUrl + '/auth/echo-headers', {
    headers: {
      authorization: 'Bearer client-token',
    },
  })
  expect(res.status).toBe(200)
  const headers = (await res.json()) as Record<string, string>
  // The backend should receive Basic auth from the proxy config,
  // not the client's Bearer token.
  expect(headers.authorization).toBe(
    `Basic ${Buffer.from('user1:pass1').toString('base64')}`,
  )
})

test('pipes a large response body correctly', async () => {
  const res = await fetch(viteTestUrl + '/big')
  expect(res.status).toBe(200)
  const text = await res.text()
  // 16 chunks × 64 KB = 1 MB
  expect(text.length).toBe(16 * 64 * 1024)
  expect(text).toMatch(/^x+$/)
})

test('returns 502 on proxy error', async () => {
  const res = await fetch(viteTestUrl + '/error')
  expect(res.status).toBe(502)
})

test('handles 204 No Content', async () => {
  const res = await fetch(viteTestUrl + '/no-content')
  expect(res.status).toBe(204)
  expect(await res.text()).toBe('')
})

test('handles client abort without server crash', async () => {
  const controller = new AbortController()
  const res = await fetch(viteTestUrl + '/slow', {
    signal: controller.signal,
  })

  // start reading the body, then abort mid-stream
  const reader = res.body!.getReader()
  await reader.read() // consume first chunk
  await new Promise((r) => setTimeout(r, 100))
  controller.abort()

  // reading should fail due to abort
  await expect(reader.read()).rejects.toThrow()

  // verify the dev server is still alive and serving normally
  const afterRes = await fetch(viteTestUrl + '/api/after-abort')
  expect(afterRes.status).toBe(200)
  expect(await afterRes.text()).toBe('backend:/api/after-abort')
})

test('rewriteWsOrigin rewrites the Origin header to match the target', async () => {
  // Send a raw WebSocket upgrade request with a custom Origin header.
  // With rewriteWsOrigin: true, the proxy rewrites Origin to the target URL.
  // The backend WS server sends back the Origin it received as a text frame.
  const wsOrigin = await sendWsUpgrade(viteTestUrl, '/ws-origin', {
    origin: 'http://localhost:9630',
  })

  // The backend echoes `ws-origin:<received-origin>`. With rewriteWsOrigin,
  // the origin should be rewritten to the backend URL (`ws://127.0.0.1:<port>`),
  // not the Vite dev server URL (`http://localhost:9630`).
  expect(wsOrigin).toMatch(/^ws-origin:ws:\/\/127\.0\.0\.1:\d+$/)
  // ensure it's not the original origin we sent
  expect(wsOrigin).not.toContain('localhost:9630')
})
