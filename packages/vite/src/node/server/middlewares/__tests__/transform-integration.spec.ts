import { createServer as createHttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import type { ViteDevServer } from '../../..'
import { createServer } from '../../..'

describe('transform middleware integration', () => {
  let server: ViteDevServer
  let httpServer: any
  let port: number

  beforeAll(async () => {
    // Create a temporary directory for testing
    const { mkdirSync, writeFileSync } = await import('node:fs')
    const tmpDir = '/tmp/vite-test-' + Date.now()
    mkdirSync(tmpDir, { recursive: true })
    mkdirSync(tmpDir + '/src', { recursive: true })
    writeFileSync(tmpDir + '/src/main.js', 'console.log("Hello World")')

    server = await createServer({
      configFile: false,
      root: tmpDir,
      server: {
        middlewareMode: true,
      },
    })

    // Create HTTP server for testing
    httpServer = createHttpServer(server.middlewares)
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port
        resolve()
      })
    })
  })

  afterAll(async () => {
    await server?.close()
    httpServer?.close()
  })

  test('HEAD request to JS file returns correct Content-Type', async () => {
    const response = await fetch(`http://localhost:${port}/src/main.js`, {
      method: 'HEAD',
    })

    // The fix ensures that HEAD requests are processed by transform middleware
    // and return the correct Content-Type header
    expect(response.headers.get('content-type')).toBe('text/javascript')
    expect(response.status).toBe(200)
  })

  test('GET request to JS file returns correct Content-Type', async () => {
    const response = await fetch(`http://localhost:${port}/src/main.js`, {
      method: 'GET',
    })

    // GET requests should work as before
    expect(response.headers.get('content-type')).toBe('text/javascript')
    expect(response.status).toBe(200)
  })

  test('HEAD request body should be empty', async () => {
    const response = await fetch(`http://localhost:${port}/src/main.js`, {
      method: 'HEAD',
    })

    // HEAD requests should not have a body
    const text = await response.text()
    expect(text).toBe('')
    expect(response.headers.get('content-type')).toBe('text/javascript')
  })

  test('GET request body should not be empty', async () => {
    const response = await fetch(`http://localhost:${port}/src/main.js`, {
      method: 'GET',
    })

    // GET requests should have a body
    const text = await response.text()
    expect(text).toBeTruthy()
    expect(response.headers.get('content-type')).toBe('text/javascript')
  })
})
