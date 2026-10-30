import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { splitFileAndPostfix } from '../../../../shared/utils'
import type { InlineConfig } from '../../../config'
import { FS_PREFIX } from '../../../constants'
import type { Plugin } from '../../../plugin'
import { createServer } from '../../../server'
import { mergeConfig, normalizePath } from '../../../utils'
import { browserUrlToModuleUrl } from '../../moduleUrl'
import { isFileLoadingAllowed } from '../static'

const FIXTURE_DIR = path.resolve(import.meta.dirname, 'fixtures')
const HTML_PATH = path.resolve(FIXTURE_DIR, 'root/index.html')
const HTML_CONTENT = fs.readFileSync(HTML_PATH, 'utf-8')
const OUTSIDE_HTML_PATH = path.resolve(FIXTURE_DIR, 'outside.html')
const OUTSIDE_HTML_CONTENT = fs.readFileSync(OUTSIDE_HTML_PATH, 'utf-8')
const VITE_PACKAGE_DIR = path.resolve(import.meta.dirname, '../../../../..')

async function createTestServer({
  root: rootDir,
  ...config
}: InlineConfig = {}) {
  const root = path.resolve(import.meta.dirname, rootDir ?? 'fixtures/root')

  const server = await createServer(
    mergeConfig(
      {
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
      },
      config,
    ),
  )

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
    const server = await createTestServer()
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
      const server = await createTestServer({ root: VITE_PACKAGE_DIR })
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
    const server = await createTestServer({
      root: 'fixtures/base-root',
      base: '/ui/',
    })

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

describe('indexHtml middleware — browser request resolution', () => {
  const cases = [
    {
      name: 'a relative path starting with a tilde',
      htmlPath: '/index.html',
      src: '~dir/../src/main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: '~dir/../src/main.ts?t=1234567890123',
    },
    {
      name: 'path segments in a query',
      htmlPath: '/nested/index.html',
      src: '../src/main.ts?path=/../file',
      moduleUrl: '/src/main.ts?path=/../file',
      expectedSrc: '../src/main.ts?t=1234567890123&path=/../file',
    },
    {
      name: 'a fragment',
      htmlPath: '/nested/index.html',
      src: '../src/main.ts#part',
      moduleUrl: '/src/main.ts',
      expectedSrc: '../src/main.ts?t=1234567890123#part',
    },
    {
      name: 'a directory document URL with a query',
      htmlPath: '/src/?q=/nested/file',
      src: './main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: './main.ts?t=1234567890123',
    },
    {
      name: 'the original document location',
      htmlPath: '/other/index.html',
      originalUrl: '/ui/src/route',
      src: './main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: './main.ts?t=1234567890123',
    },
    {
      name: 'SPA fallback rewriting',
      htmlPath: '/index.html',
      originalUrl: '/ui/client/route',
      src: './src/main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: '/ui/src/main.ts?t=1234567890123',
    },
    {
      name: 'a module path starting with the base',
      base: '/src/',
      htmlPath: '/index.html',
      src: '/src/main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: '/src/src/main.ts?t=1234567890123',
    },
    {
      name: 'an encoded base',
      base: '/a%20b/',
      htmlPath: '/src/index.html',
      src: './main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: './main.ts?t=1234567890123',
    },
  ]

  for (const {
    name,
    base = '/ui/',
    htmlPath,
    originalUrl,
    src,
    moduleUrl,
    expectedSrc,
  } of cases) {
    test(`handles HMR, warmup, and safe paths with ${name}`, async () => {
      const server = await createTestServer({
        root: 'fixtures/base-root',
        base,
      })
      const mod =
        await server.environments.client.moduleGraph.ensureEntryFromUrl(
          moduleUrl,
        )
      mod.lastHMRTimestamp = 1234567890123
      server.config.safeModulePaths.clear()
      const warmupRequest = vi
        .spyOn(server, 'warmupRequest')
        .mockResolvedValue(undefined)

      const transformed = await server.transformIndexHtml(
        htmlPath,
        `<script type="module" src="${src}"></script>`,
        originalUrl,
      )

      expect(transformed).toContain(`src="${expectedSrc}"`)
      expect(warmupRequest).toHaveBeenCalledExactlyOnceWith(moduleUrl)
      expect(server.config.safeModulePaths).toContain(mod.id)
    })
  }

  test('adds HMR timestamps to relative classic scripts without warming or registering them', async () => {
    const server = await createTestServer({
      root: 'fixtures/base-root',
      base: '/ui/',
    })
    const mod =
      await server.environments.client.moduleGraph.ensureEntryFromUrl(
        '/src/main.ts',
      )
    mod.lastHMRTimestamp = 1234567890123
    server.config.safeModulePaths.clear()
    const warmupRequest = vi
      .spyOn(server, 'warmupRequest')
      .mockResolvedValue(undefined)

    const transformed = await server.transformIndexHtml(
      '/index.html',
      '<script src="./src/main.ts"></script>',
    )

    expect(transformed).toContain('src="./src/main.ts?t=1234567890123"')
    expect(warmupRequest).not.toHaveBeenCalled()
    expect(server.config.safeModulePaths).not.toContain(mod.id)
  })

  test('does not warm an HTML document referenced by a query-only URL', async () => {
    const server = await createTestServer({
      root: 'fixtures/base-root',
      base: '/ui/',
    })
    const warmupRequest = vi
      .spyOn(server, 'warmupRequest')
      .mockResolvedValue(undefined)

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="?foo"></script>',
    )

    expect(warmupRequest).not.toHaveBeenCalled()
  })

  test('does not warm a public script referenced by an encoded relative URL', async () => {
    const server = await createTestServer({
      root: 'fixtures/base-root',
      base: '/ui/',
      publicDir: path.join(FIXTURE_DIR, 'base-root/src'),
    })
    const warmupRequest = vi
      .spyOn(server, 'warmupRequest')
      .mockResolvedValue(undefined)

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="./%6dain.ts"></script>',
    )

    expect(warmupRequest).not.toHaveBeenCalled()
  })
})

describe('indexHtml middleware — safe module paths', () => {
  for (const url of ['./malformed%zz.js', '\\\\%']) {
    test(`leaves malformed URL ${url} for the browser`, async () => {
      const server = await createTestServer()

      await expect(
        server.transformIndexHtml(
          '/index.html',
          `<script type="module" src="${url}"></script>`,
        ),
      ).resolves.toContain(`src="${url}"`)
    })
  }

  test('registers symlinked module and static asset paths', async () => {
    const dir = fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), 'vite-html-')),
    )
    const root = path.join(dir, 'root')
    const target = path.join(dir, 'target')
    fs.mkdirSync(root)
    fs.mkdirSync(target)
    fs.writeFileSync(path.join(target, 'entry.js'), 'export const answer = 42')
    fs.writeFileSync(path.join(target, 'image.svg'), '<svg/>')
    fs.writeFileSync(path.join(target, 'other.svg'), '<svg/>')
    fs.symlinkSync(target, path.join(root, 'linked'), 'junction')
    const server = await createTestServer({
      root,
      server: {
        fs: { allow: [] },
        preTransformRequests: false,
      },
    })
    onTestFinished(async () => {
      await server.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="/linked/entry.js"></script><img src="/linked/image.svg">',
    )

    const result =
      await server.environments.client.transformRequest('/linked/entry.js')
    expect(result?.code).toContain('answer = 42')
    for (const base of [path.join(root, 'linked'), target]) {
      const image = normalizePath(path.join(base, 'image.svg'))
      const other = normalizePath(path.join(base, 'other.svg'))
      expect(isFileLoadingAllowed(server.config, image)).toBe(true)
      expect(isFileLoadingAllowed(server.config, other)).toBe(false)
    }
  })

  for (const base of ['/', '/ui/']) {
    test(`registers custom-resolved source and injected modules with base ${base}`, async () => {
      const root = path.join(FIXTURE_DIR, 'root')
      const modules = {
        '/nested/custom.css?direct&raw': 'style.css?raw',
        '/nested/custom-dynamic.js?url&label=hello world': 'dynamic.js?url',
        '/nested/custom-classic.js?raw': 'classic.js?raw',
        '/nested/custom-entry.data?raw&label=hello world':
          '../outside.html?raw',
        '/nested/custom-preload.data?url': 'classic.js?url',
        '/nested/custom-preload-script.data?raw': 'style.css?url',
        '/nested/custom.svg?imported': 'classic.js?raw&image',
        'custom-entry': 'dynamic.js?raw&wrapped',
        'relative-entry': 'dynamic.js?raw&relative',
      }
      const server = await createTestServer({
        base,
        server: {
          fs: { allow: [] },
          preTransformRequests: false,
        },
        plugins: [
          {
            name: 'custom-html-module-resolver',
            enforce: 'pre',
            resolveId(id) {
              const file = modules[id as keyof typeof modules]
              if (file) return path.join(root, file)
            },
            transformIndexHtml: {
              order: 'pre',
              handler() {
                return [
                  {
                    tag: 'script',
                    attrs: { type: 'module', src: './custom-classic.js?raw' },
                  },
                ]
              },
            },
          },
          {
            name: 'inject-html-module',
            transformIndexHtml: {
              order: 'pre',
              handler(html) {
                return (
                  html +
                  `<script type="module" src="./custom-entry.data?raw&label=hello%20world&import#part"></script>
                 <link rel=" MODULEPRELOAD " href="./custom-preload.data?url">
                 <link rel="preload" as="SCRIPT" href="./custom-preload-script.data?raw">
                 <script type="module" src="/@id/custom-entry"></script>
                 <script type="module" src="../@id/relative-entry"></script>`
                )
              },
            },
          },
        ],
      })

      await server.transformIndexHtml(
        '/nested/index.html',
        `<link rel="stylesheet" href="custom.css?raw">
         <img src="./custom.svg?imported&import&t=1234567890123">
         <script>import('./custom-dynamic.js?url&label=hello%20world&import&t=1234567890123')</script>`,
      )

      for (const [url, file] of Object.entries(modules)) {
        expect(server.config.safeModulePaths, url).toContain(
          normalizePath(path.join(root, file)),
        )
        const result = await server.environments.client.transformRequest(url)
        expect(result).not.toBeNull()
        if (url.startsWith('/nested/')) {
          expect(server.config.safeModulePaths).not.toContain(
            normalizePath(path.join(root, url)),
          )
        }
      }
    })
  }

  test('resolves browser URLs before removing the configured base', async () => {
    const server = await createTestServer({
      base: '/ui/',
      server: { fs: { allow: [] } },
      plugins: [
        {
          name: 'inject-relative-entry',
          transformIndexHtml: {
            order: 'pre',
            handler() {
              return [
                {
                  tag: 'script',
                  attrs: { type: 'module', src: '../ui/classic.js?raw' },
                },
              ]
            },
          },
        },
      ],
    })

    await server.transformIndexHtml('/index.html', '')

    const root = path.join(FIXTURE_DIR, 'root')
    expect(server.config.safeModulePaths).toContain(
      normalizePath(path.join(root, 'classic.js?raw')),
    )
    expect(server.config.safeModulePaths).not.toContain(
      normalizePath(path.join(root, 'ui/classic.js')),
    )
    expect(
      await server.environments.client.transformRequest('/classic.js?raw'),
    ).not.toBeNull()
  })

  test('warms and registers plugin-resolved HTML dependencies', async () => {
    const resolvedId = normalizePath(OUTSIDE_HTML_PATH) + '?raw'
    const server = await createTestServer({
      server: { fs: { allow: [] } },
      plugins: [
        {
          name: 'resolve-warmed-script',
          enforce: 'pre',
          async resolveId(id) {
            if (id === '/entry.js?raw') return resolvedId
          },
        },
      ],
    })
    const warmupRequest = vi.spyOn(server, 'warmupRequest')

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="/entry.js?raw"></script>',
    )

    expect(warmupRequest).toHaveBeenCalledWith('/entry.js?raw')
    expect(server.config.safeModulePaths).toContain(resolvedId)
    await Promise.all(warmupRequest.mock.results.map(({ value }) => value))
    expect(
      server.environments.client.moduleGraph.getModuleById(resolvedId)
        ?.transformResult?.code,
    ).toContain('Outside root')
  })

  test('maps configured iframe sources as document requests', async () => {
    const resolveId = vi.fn((id: string) => {
      if (id === '/classic.js') return OUTSIDE_HTML_PATH
    })
    const server = await createTestServer({
      server: {
        fs: { allow: [] },
        preTransformRequests: false,
      },
      html: {
        additionalAssetSources: {
          iframe: { srcAttributes: ['src'] },
        },
      },
      plugins: [
        {
          name: 'resolve-frame-source',
          enforce: 'pre',
          resolveId,
        },
      ],
    })

    await server.transformIndexHtml(
      '/index.html',
      '<iframe src="./classic.js"></iframe>',
    )

    expect(
      isFileLoadingAllowed(
        server.config,
        normalizePath(path.join(FIXTURE_DIR, 'root/classic.js')),
      ),
    ).toBe(true)
    expect(resolveId.mock.calls.map(([id]) => id)).not.toContain('/classic.js')
    expect(server.config.safeModulePaths).not.toContain(OUTSIDE_HTML_PATH)
  })

  test('registers aliased stylesheets at the path used for transformation', async () => {
    const server = await createTestServer({
      server: { fs: { allow: [] } },
      resolve: {
        alias: {
          '/@': path.join(FIXTURE_DIR, 'root'),
        },
      },
    })

    await server.transformIndexHtml(
      '/index.html',
      '<link rel="stylesheet" href="/@/style.css?direct">',
    )

    const filePath = normalizePath(path.join(FIXTURE_DIR, 'root/style.css'))
    expect(server.config.safeModulePaths).toContain(filePath)
    expect(server.config.safeModulePaths).toContain(filePath + '?direct')
    const result = await server.environments.client.transformRequest(
      '/@/style.css?direct',
    )
    expect(result?.code).toContain('color: red')
  })

  describe('HTML tag registration', () => {
    const cases: {
      name: string
      html: string
      plugins: Plugin[]
      files: string[]
      base?: string
      expectedHtml?: string
    }[] = [
      {
        name: 'source assets accepted by filters before URL rewriting',
        base: '/ui/',
        html: '<custom-img data-src="/style.css?filtered"></custom-img>',
        expectedHtml: 'data-src="/ui/style.css?filtered"',
        plugins: [
          {
            name: 'filter-source-assets',
            config() {
              return {
                html: {
                  additionalAssetSources: {
                    'custom-img': {
                      srcAttributes: ['data-src'],
                      filter: ({ value }) => value.startsWith('/style.css'),
                    },
                  },
                },
              }
            },
          },
        ],
        files: ['style.css?filtered'],
      },
      {
        name: 'nested injected asset tags, srcsets, and additional asset sources',
        html: HTML_CONTENT,
        plugins: [
          {
            name: 'inject-html-assets',
            config() {
              return {
                html: {
                  additionalAssetSources: {
                    'custom-img': { srcAttributes: ['data-src'] },
                  },
                },
              }
            },
            transformIndexHtml: {
              order: 'pre',
              handler() {
                return [
                  {
                    tag: 'div',
                    injectTo: 'body',
                    children: [
                      {
                        tag: 'img',
                        attrs: {
                          src: './classic.js?image',
                          srcset:
                            './classic.js?small 1x, ./dynamic.js?large 2x',
                        },
                      },
                      { tag: 'video', attrs: { poster: './style.css?poster' } },
                      {
                        tag: 'custom-img',
                        attrs: { 'data-src': './style.css?custom' },
                      },
                    ],
                  },
                ]
              },
            },
          },
        ],
        files: [
          'classic.js?image',
          'classic.js?small',
          'dynamic.js?large',
          'style.css?poster',
          'style.css?custom',
        ],
      },
    ]
    for (const { name, html, plugins, files, base, expectedHtml } of cases) {
      test(`registers URLs while scanning ${name}`, async () => {
        const server = await createTestServer({
          plugins,
          base,
          server: { preTransformRequests: false },
        })

        const transformed = await server.transformIndexHtml('/index.html', html)
        if (expectedHtml) expect(transformed).toContain(expectedHtml)

        for (const file of files) {
          const { file: filename, postfix } = splitFileAndPostfix(file)
          const filePath = normalizePath(
            path.resolve(FIXTURE_DIR, 'root', filename),
          )
          expect(server.config.safeModulePaths).toContain(filePath)
          expect(server.config.safeModulePaths).toContain(filePath + postfix)
        }
      })
    }
  })
})
