import { expect, test } from 'vitest'
import { viteTestUrl } from '~utils'

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
