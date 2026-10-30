import fs from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { createServer } from '..'
import type { ViteDevServer } from '..'
import { send } from '../server/send'

const CONFIGURED_HEADERS = {
  'x-configured-header': 'present',
  'access-control-allow-origin': 'https://example.com',
}

describe('304 responses keep ETag, Cache-Control and configured headers', () => {
  let server: ViteDevServer | undefined
  let httpServer: Server | undefined
  let root = ''

  afterEach(async () => {
    await new Promise<void>((resolve) =>
      httpServer ? httpServer.close(() => resolve()) : resolve(),
    )
    httpServer = undefined
    await server?.close()
    server = undefined
    if (root) fs.rmSync(root, { recursive: true, force: true })
    root = ''
  })

  async function listen(s: Server): Promise<string> {
    await new Promise<void>((resolve) =>
      s.listen(0, '127.0.0.1', () => resolve()),
    )
    return `http://127.0.0.1:${(s.address() as AddressInfo).port}`
  }

  async function startDevServer(
    files: Record<string, string>,
  ): Promise<string> {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-304-'))
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(root, name), content)
    }
    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, ws: false, headers: CONFIGURED_HEADERS },
    })
    httpServer = createHttpServer(server.middlewares)
    return listen(httpServer)
  }

  // send()'s 304 branch
  test('send() applies the configured headers on a 304', async () => {
    const etag = 'W/"test-etag"'
    httpServer = createHttpServer((req, res) => {
      send(req, res, 'export const value = 1', 'js', {
        etag,
        cacheControl: 'no-cache',
        headers: CONFIGURED_HEADERS,
      })
    })
    const base = await listen(httpServer)

    const res = await fetch(base, { headers: { 'if-none-match': etag } })
    expect(res.status).toBe(304)
    expect(res.headers.get('etag')).toBe(etag)
    expect(res.headers.get('cache-control')).toBe('no-cache')
    expect(res.headers.get('x-configured-header')).toBe('present')
    expect(await res.text()).toBe('')
  })

  // cachedTransformMiddleware 304 shortcut
  test('a JS module 304 keeps the headers', async () => {
    const base = await startDevServer({ 'mod.js': 'export const value = 1\n' })

    const first = await fetch(`${base}/mod.js`)
    expect(first.status).toBe(200)
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()
    expect(first.headers.get('x-configured-header')).toBe('present')

    const second = await fetch(`${base}/mod.js`, {
      headers: { 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
    expect(second.headers.get('etag')).toBe(etag)
    expect(second.headers.get('cache-control')).toBe('no-cache')
    expect(second.headers.get('x-configured-header')).toBe('present')
  })

  // versioned URLs keep their immutable Cache-Control
  test('a versioned module 304 keeps its immutable Cache-Control', async () => {
    const base = await startDevServer({ 'dep.js': 'export const value = 1\n' })

    const first = await fetch(`${base}/dep.js?v=abcdef12`)
    expect(first.status).toBe(200)
    expect(first.headers.get('cache-control')).toContain('immutable')
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()

    const second = await fetch(`${base}/dep.js?v=abcdef12`, {
      headers: { 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
    expect(second.headers.get('cache-control')).toContain('immutable')
    expect(second.headers.get('x-configured-header')).toBe('present')
  })

  // CSS early-304 shortcut
  test('a direct CSS 304 keeps the headers', async () => {
    const base = await startDevServer({ 'style.css': '.a { color: red }\n' })

    const first = await fetch(`${base}/style.css`, {
      headers: { accept: 'text/css' },
    })
    expect(first.status).toBe(200)
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()
    expect(first.headers.get('x-configured-header')).toBe('present')

    const second = await fetch(`${base}/style.css`, {
      headers: { accept: 'text/css', 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
    expect(second.headers.get('etag')).toBe(etag)
    expect(second.headers.get('cache-control')).toBe('no-cache')
    expect(second.headers.get('x-configured-header')).toBe('present')
  })
})
