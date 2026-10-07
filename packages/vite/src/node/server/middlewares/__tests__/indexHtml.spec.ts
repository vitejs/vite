import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { FS_PREFIX } from '../../../constants'
import { createServer } from '../../../server'

const FIXTURE_DIR = path.resolve(import.meta.dirname, 'fixtures')
const HTML_PATH = path.resolve(FIXTURE_DIR, 'root/index.html')
const HTML_CONTENT = fs.readFileSync(HTML_PATH, 'utf-8')
const VITE_PACKAGE_DIR = path.resolve(import.meta.dirname, '../../../../..')

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

describe('indexHtml middleware — inline script proxy cache', () => {
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

  for (const prefix of ['//', '///']) {
    test(`does not preserve a protocol-relative request URL (${prefix}) as the inline module proxy URL`, async () => {
      const server = await createTestServer(VITE_PACKAGE_DIR)
      const url = prefix + 'evil.example.com/payload.js?/../../package.json'

      const transformed = await server.transformIndexHtml(url, HTML_CONTENT)
      const proxyUrlMatch = transformed.match(/src="([^"]*html-proxy[^"]*)"/)

      expect(
        proxyUrlMatch,
        'devHtmlHook should have rewritten the inline <script> to a ?html-proxy src',
      ).toBeTruthy()
      expect(proxyUrlMatch![1]).toMatchInlineSnapshot(
        `"/@id/__x00__/evil.example.com/payload.js?/../../package.json?html-proxy&index=0.js"`,
      )
      expect(proxyUrlMatch![1]).not.toMatch(/^\/\//)
    })
  }
})

describe('indexHtml middleware — transformIndexHtml with a query on a directory URL', () => {
  // https://github.com/vitejs/vite/issues/23679
  test('does not watch the directory for an inline <style> proxy module', async () => {
    const server = await createTestServer()
    const watched: string[] = []
    const add = server.watcher.add.bind(server.watcher)
    server.watcher.add = (paths) => {
      watched.push(...[paths].flat())
      return add(paths)
    }

    await server.transformIndexHtml(
      '/?foo=bar',
      '<html><head><style>body { color: red; }</style></head></html>',
    )

    const watchedDirs = watched.filter((file) =>
      fs.statSync(file, { throwIfNoEntry: false })?.isDirectory(),
    )
    expect(watchedDirs).toEqual([])
    expect(
      server.environments.client.moduleGraph.urlToModuleMap.has(
        '/?foo=bar?html-proxy&direct&index=0.css',
      ),
    ).toBe(false)
  })
})

describe('indexHtml middleware — HMR timestamp injection with non-root base', () => {
  test('entry script URL gets the lastHMRTimestamp query when base is not root', async () => {
    const root = path.resolve(import.meta.dirname, 'fixtures/base-root')
    const server = await createServer({
      configFile: false,
      root,
      base: '/ui/',
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

    // Register the entry in the module graph under the base-stripped URL
    // (as the transform middleware records it) and mark it HMR-updated.
    await server.environments.client.transformRequest('/src/main.ts')
    const mod =
      server.environments.client.moduleGraph.urlToModuleMap.get('/src/main.ts')
    expect(
      mod,
      'entry module should be registered under the base-stripped URL',
    ).toBeTruthy()
    const timestamp = 1234567890
    mod!.lastHMRTimestamp = timestamp

    const html = `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`
    const transformed = await server.transformIndexHtml('/index.html', html)

    // Without stripping the base before the module graph lookup, the entry
    // stays a bare `/ui/src/main.ts` while the module's own references get
    // the timestamp — two different URLs for the same module, executing the
    // entry twice.
    expect(transformed).toContain(`src="/ui/src/main.ts?t=${timestamp}"`)
  })
})
