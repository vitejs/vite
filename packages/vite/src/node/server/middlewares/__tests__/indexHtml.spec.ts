import fs from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../../../server'
import { FS_PREFIX } from '../../../constants'

const FIXTURE_DIR = path.resolve(import.meta.dirname, 'fixtures')
const HTML_PATH = path.resolve(FIXTURE_DIR, 'root/index.html')
const HTML_CONTENT = fs.readFileSync(HTML_PATH, 'utf-8')

async function createTestServer(rootDir?: string) {
  const root = path.resolve(import.meta.dirname, rootDir ?? 'fixtures/root')

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    server: {
      middlewareMode: true,
      ws: false,
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
  })

  onTestFinished(() => server.close())
  return server
}

describe('indexHtml middleware — malformed URI guard (non-fullBundle path)', () => {
  test('request with malformed URI falls through to next() rather than throwing URIError', async () => {
    const server = await createTestServer()

    // Wrap the Vite middleware stack in a real HTTP server so we can observe the
    // HTTP status code instead of catching an unhandled async exception.
    const httpServer = http.createServer(server.middlewares)
    await new Promise<void>((resolve) =>
      httpServer.listen(0, '127.0.0.1', resolve),
    )
    onTestFinished(() => httpServer.close())

    const { port } = httpServer.address() as AddressInfo

    // /%c0.html → decodeURIComponent would throw URIError without the guard.
    // With the guard it calls next() and the request falls through to a 404.
    const response = await fetch(`http://127.0.0.1:${port}/%c0.html`)
    expect(response.status).not.toBe(500)
  })
})

describe('indexHtml middleware — /@fs/ inline script proxy cache', () => {
  test('inline <script type="module"> in an /@fs/ HTML file is loadable via the html-proxy module', async () => {
    const server = await createTestServer()
    const fsUrl = path.posix.join(FS_PREFIX, HTML_PATH)

    const transformed = await server.transformIndexHtml(fsUrl, HTML_CONTENT)

    expect(transformed).toContain('html-proxy')
    expect(transformed).toContain('index=0')

    const proxyUrlMatch = transformed.match(/src="([^"]*html-proxy[^"]*)"/)
    expect(
      proxyUrlMatch,
      'devHtmlHook should have rewritten the inline <script> to a ?html-proxy src',
    ).toBeTruthy()

    const proxyModuleUrl = proxyUrlMatch![1]

    const result =
      await server.environments.client.transformRequest(proxyModuleUrl)

    expect(
      result,
      'proxy module should resolve without a cache-miss error',
    ).not.toBeNull()
    expect(result!.code).toContain('module loaded')
  })

  test('inline <script type="module"> in an HTML file served from root is loadable via the html-proxy module', async () => {
    const server = await createTestServer('fixtures/root')
    const url = '/index.html'

    const htmlPath = path.resolve(
      import.meta.dirname,
      'fixtures/root/index.html',
    )
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

    const transformed = await server.transformIndexHtml(url, htmlContent)

    expect(transformed).toContain('html-proxy')
    expect(transformed).toContain('index=0')

    const proxyUrlMatch = transformed.match(/src="([^"]*html-proxy[^"]*)"/)
    expect(
      proxyUrlMatch,
      'devHtmlHook should rewrite the inline <script> to a ?html-proxy src',
    ).toBeTruthy()

    const proxyModuleUrl = proxyUrlMatch![1]
    const result =
      await server.environments.client.transformRequest(proxyModuleUrl)

    expect(result, 'proxy module should resolve without error').not.toBeNull()
    expect(result!.code).toContain('module loaded')
  })
})
