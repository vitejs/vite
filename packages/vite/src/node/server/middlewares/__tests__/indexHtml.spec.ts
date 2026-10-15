import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { splitFileAndPostfix } from '../../../../shared/utils'
import { FS_PREFIX } from '../../../constants'
import type { Plugin } from '../../../plugin'
import { createServer } from '../../../server'
import { browserUrlToModuleUrl } from '../../moduleUrl'

const FIXTURE_DIR = path.resolve(import.meta.dirname, 'fixtures')
const HTML_PATH = path.resolve(FIXTURE_DIR, 'root/index.html')
const HTML_CONTENT = fs.readFileSync(HTML_PATH, 'utf-8')
const OUTSIDE_HTML_PATH = path.resolve(FIXTURE_DIR, 'outside.html')
const OUTSIDE_HTML_CONTENT = fs.readFileSync(OUTSIDE_HTML_PATH, 'utf-8')
const VITE_PACKAGE_DIR = path.resolve(import.meta.dirname, '../../../../..')

async function createTestServer(
  rootDir?: string,
  plugins?: Plugin[],
  base?: string,
) {
  const root = path.resolve(import.meta.dirname, rootDir ?? 'fixtures/root')

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    plugins,
    base,
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

    const proxyModuleUrl = browserUrlToModuleUrl(
      proxyUrlMatch![1],
      server.config.decodedBase,
    )
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

    const proxyModuleUrl = browserUrlToModuleUrl(
      proxyUrlMatch![1],
      server.config.decodedBase,
    )
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

describe('indexHtml middleware — file watching', () => {
  test('watches an /@fs/ HTML file outside root', async () => {
    const server = await createTestServer()
    const addSpy = vi
      .spyOn(server.watcher, 'add')
      .mockImplementation(() => server.watcher)
    const fsUrl = path.posix.join(FS_PREFIX, OUTSIDE_HTML_PATH)

    await server.transformIndexHtml(fsUrl, OUTSIDE_HTML_CONTENT)

    expect(addSpy).toHaveBeenCalledWith(OUTSIDE_HTML_PATH)
  })

  test('does not watch a directory for a root URL with a query', async () => {
    const server = await createTestServer()
    const addSpy = vi
      .spyOn(server.watcher, 'add')
      .mockImplementation(() => server.watcher)
    const html = '<style>body { color: red; }</style>'

    await server.transformIndexHtml('/?foo=bar', html)

    expect(addSpy).not.toHaveBeenCalledWith('/')
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

describe('indexHtml middleware — safe module paths', () => {
  for (const url of ['./malformed%zz.js', '\\\\%']) {
    test(`leaves malformed URL ${url} for the browser`, async () => {
      const server = await createTestServer()

      await expect(
        server.transformIndexHtml(
          '/index.html',
          `<script src="${url}"></script>`,
        ),
      ).resolves.toContain(`src="${url}"`)
    })
  }

  const cases = [
    ['/index.html', './classic.js?raw', 'classic.js?raw'],
    ['/index.html', '../classic.js?raw', 'classic.js?raw'],
    ['/nested/index.html', './classic.js?raw', 'nested/classic.js?raw'],
    ['/nested/index.html', 'classic.js?raw', 'nested/classic.js?raw'],
    ['/nested/index.html', '../classic.js?raw', 'classic.js?raw'],
    ['/nested/index.html', '/classic.js?raw', 'classic.js?raw'],
    ['/nested/', './classic.js?raw', 'nested/classic.js?raw'],
    ['/nested/?q=1', './classic.js?raw', 'nested/classic.js?raw'],
    ['/nested/index.html', './a%20b.js?raw', 'nested/a b.js?raw'],
    [
      '/nested/index.html',
      './classic.js?path=/../file',
      'nested/classic.js?path=/../file',
    ],
  ]
  for (const [htmlPath, url, file] of cases) {
    test(`resolves ${htmlPath} with ${url} as an HTML path`, async () => {
      const server = await createTestServer()

      await server.transformIndexHtml(
        htmlPath,
        `<script src="${url}"></script>`,
      )

      const { file: filename, postfix } = splitFileAndPostfix(file)
      const filePath = path.join(FIXTURE_DIR, 'root', filename)
      expect(server.config.safeModulePaths).toContain(filePath)
      expect(server.config.safeModulePaths).toContain(filePath + postfix)
    })
  }

  test('registers relative URLs from an /@fs/ HTML file', async () => {
    const server = await createTestServer()
    const fsUrl = path.posix.join(FS_PREFIX, OUTSIDE_HTML_PATH)

    await server.transformIndexHtml(
      fsUrl,
      '<script src="./classic.js?raw"></script>',
    )

    expect(server.config.safeModulePaths).toContain(
      path.join(FIXTURE_DIR, 'classic.js?raw'),
    )
  })

  test('resolves parent URLs at the URL root', async () => {
    const server = await createTestServer()
    server.config.server.fs.allow = [path.join(FIXTURE_DIR, 'root')]

    await server.transformIndexHtml(
      '/index.html',
      '<script src="../outside.html"></script>',
    )

    expect(server.config.safeModulePaths).toContain(
      path.join(FIXTURE_DIR, 'root/outside.html'),
    )
    expect(server.config.safeModulePaths).not.toContain(OUTSIDE_HTML_PATH)
  })

  for (const url of ['/ui/classic.js?raw', './classic.js?raw']) {
    test(`registers ${url} with a non-root base`, async () => {
      const server = await createTestServer(undefined, undefined, '/ui/')

      await server.transformIndexHtml(
        '/index.html',
        `<script src="${url}"></script>`,
      )

      const filePath = path.join(FIXTURE_DIR, 'root/classic.js')
      expect(server.config.safeModulePaths).toContain(filePath)
      expect(server.config.safeModulePaths).toContain(filePath + '?raw')
    })
  }

  test('uses HTML paths for source and injected URLs with a custom module resolver', async () => {
    const server = await createTestServer(undefined, [
      {
        name: 'custom-module-resolver',
        enforce: 'pre',
        resolveId(id) {
          if (id === 'classic.js?raw' || id === './dynamic.js?url') {
            return OUTSIDE_HTML_PATH
          }
        },
        transformIndexHtml() {
          return [{ tag: 'script', attrs: { src: './dynamic.js?url' } }]
        },
      },
    ])

    await server.transformIndexHtml(
      '/index.html',
      '<script src="classic.js?raw"></script>',
    )

    for (const file of ['classic.js?raw', 'dynamic.js?url']) {
      expect(server.config.safeModulePaths).toContain(
        path.join(FIXTURE_DIR, 'root', file),
      )
    }
    expect(server.config.safeModulePaths).not.toContain(OUTSIDE_HTML_PATH)
  })

  test('registers URLs while scanning source HTML tags', async () => {
    const server = await createTestServer()
    const html = `
      <link rel="stylesheet" href="./style.css?direct">
      <script src="./classic.js?raw"></script>
      <script>import('./dynamic.js?url')</script>
    `

    await server.transformIndexHtml('/index.html', html)

    for (const [file, query] of [
      ['style.css', '?direct'],
      ['classic.js', '?raw'],
      ['dynamic.js', '?url'],
    ]) {
      const filePath = path.resolve(FIXTURE_DIR, 'root', file)
      expect(server.config.safeModulePaths).toContain(filePath)
      expect(server.config.safeModulePaths).toContain(filePath + query)
    }
  })

  test('registers URLs while scanning plugin-injected tags', async () => {
    const server = await createTestServer(undefined, [
      {
        name: 'inject-safe-module-tags',
        transformIndexHtml() {
          return [
            {
              tag: 'link',
              attrs: { rel: 'stylesheet', href: './style.css?direct' },
            },
            {
              tag: 'script',
              attrs: { src: './classic.js?raw' },
            },
          ]
        },
      },
    ])

    await server.transformIndexHtml('/index.html', HTML_CONTENT)

    for (const [file, query] of [
      ['style.css', '?direct'],
      ['classic.js', '?raw'],
    ]) {
      const filePath = path.resolve(FIXTURE_DIR, 'root', file)
      expect(server.config.safeModulePaths).toContain(filePath)
      expect(server.config.safeModulePaths).toContain(filePath + query)
    }
  })
})
