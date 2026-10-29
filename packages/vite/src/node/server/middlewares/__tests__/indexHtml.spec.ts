import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { splitFileAndPostfix } from '../../../../shared/utils'
import { FS_PREFIX } from '../../../constants'
import type { Plugin } from '../../../plugin'
import { createServer } from '../../../server'
import { normalizePath } from '../../../utils'
import { browserUrlToModuleUrl } from '../../moduleUrl'
import { isFileLoadingAllowed } from '../static'

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

describe('indexHtml middleware — browser request resolution', () => {
  test.each([
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
    {
      name: 'a relative classic script',
      htmlPath: '/index.html',
      src: './src/main.ts',
      moduleUrl: '/src/main.ts',
      expectedSrc: './src/main.ts?t=1234567890123',
      classic: true,
    },
  ])(
    'handles HMR, warmup, and safe paths with $name',
    async ({
      base = '/ui/',
      htmlPath,
      originalUrl,
      src,
      moduleUrl,
      expectedSrc,
      classic = false,
    }) => {
      const server = await createTestServer('fixtures/base-root', [], base)
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
        `<script${classic ? '' : ' type="module"'} src="${src}"></script>`,
        originalUrl,
      )

      expect(transformed).toContain(`src="${expectedSrc}"`)
      if (classic) {
        expect(warmupRequest).not.toHaveBeenCalled()
        expect(server.config.safeModulePaths).not.toContain(mod.id)
      } else {
        expect(warmupRequest).toHaveBeenCalledExactlyOnceWith(moduleUrl)
        expect(server.config.safeModulePaths).toContain(mod.id)
      }
    },
  )

  test('does not warm an HTML document referenced by a query-only URL', async () => {
    const server = await createTestServer('fixtures/base-root', [], '/ui/')
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
    const server = await createTestServer(
      'fixtures/base-root',
      [
        {
          name: 'public-html-assets',
          config: () => ({
            publicDir: path.join(FIXTURE_DIR, 'base-root/src'),
          }),
        },
      ],
      '/ui/',
    )
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

  const cases: [htmlPath: string, url: string, file: string, base?: string][] =
    [
      ['/index.html', './classic.js?raw', 'classic.js?raw'],
      ['/index.html', '/classic.js?raw#part', 'classic.js?raw'],
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
      [
        path.posix.join(FS_PREFIX, OUTSIDE_HTML_PATH),
        './classic.js?raw',
        '../classic.js?raw',
      ],
      [
        '/index.html',
        `${path.posix.join(FS_PREFIX, normalizePath(OUTSIDE_HTML_PATH))}?raw`,
        '../outside.html?raw',
      ],
      ['/index.html', '/classic.js?raw', 'classic.js?raw', '/ui/'],
      ['/index.html', '/ui/classic.js?raw', 'ui/classic.js?raw', '/ui/'],
      ['/index.html', './classic.js?raw', 'classic.js?raw', '/ui/'],
      ['/index.html', '/src/main.ts', 'src/main.ts', '/src/'],
    ]
  for (const [htmlPath, url, file, base] of cases) {
    test(`resolves ${htmlPath} with ${url} as an HTML path${base ? ` with base ${base}` : ''}`, async () => {
      const server = await createTestServer(undefined, undefined, base)

      await server.transformIndexHtml(
        htmlPath,
        `<script type="module" src="${url}"></script>`,
      )

      const { file: filename, postfix } = splitFileAndPostfix(file)
      const filePath = normalizePath(path.join(FIXTURE_DIR, 'root', filename))
      expect(server.config.safeModulePaths).toContain(filePath)
      expect(server.config.safeModulePaths).toContain(filePath + postfix)
    })
  }

  test('resolves parent URLs at the URL root', async () => {
    const server = await createTestServer()
    server.config.server.fs.allow = [
      normalizePath(path.join(FIXTURE_DIR, 'root')),
    ]

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="../outside.html"></script>',
    )

    expect(server.config.safeModulePaths).toContain(
      normalizePath(path.join(FIXTURE_DIR, 'root/outside.html')),
    )
    expect(server.config.safeModulePaths).not.toContain(
      normalizePath(OUTSIDE_HTML_PATH),
    )
  })

  test('registers symlinked module and static asset paths', async () => {
    const dir = fs.realpathSync(
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
    const server = await createTestServer(root)
    onTestFinished(async () => {
      await server.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })
    server.config.server.fs.allow = []
    server.config.server.preTransformRequests = false

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
        '/nested/custom-entry.data?raw': 'dynamic.js?raw',
        '/nested/custom-preload.data?url': 'classic.js?url',
        '/nested/custom-preload-script.data?raw': 'style.css?url',
        '/nested/custom.svg?imported': 'classic.js?raw&image',
        'custom-entry': 'dynamic.js?raw&wrapped',
        'relative-entry': 'dynamic.js?raw&relative',
      }
      const server = await createTestServer(
        undefined,
        [
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
                  `<script type="module" src="./custom-entry.data?raw"></script>
                 <link rel=" MODULEPRELOAD " href="./custom-preload.data?url">
                 <link rel="preload" as="SCRIPT" href="./custom-preload-script.data?raw">
                 <script type="module" src="/@id/custom-entry"></script>
                 <script type="module" src="../@id/relative-entry"></script>`
                )
              },
            },
          },
        ],
        base,
      )
      server.config.server.fs.allow = []
      server.config.server.preTransformRequests = false

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
    const server = await createTestServer(
      undefined,
      [
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
      '/ui/',
    )
    server.config.server.fs.allow = []

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

  for (const base of ['/ui/', '/a%20b/', '/%E3%81%82/']) {
    test(`uses the browser document location for asset URLs with base ${base}`, async () => {
      const server = await createTestServer(undefined, undefined, base)
      server.config.server.preTransformRequests = false

      await server.transformIndexHtml(
        '/other/index.html',
        '<img src="./image.svg?size=2#icon">',
        `${base}client/route`,
      )

      expect(server.config.safeModulePaths).toContain(
        normalizePath(path.join(FIXTURE_DIR, 'root/client/image.svg?size=2')),
      )
      expect(server.config.safeModulePaths).not.toContain(
        normalizePath(path.join(FIXTURE_DIR, 'root/image.svg')),
      )
    })
  }

  test('uses the plugin target for script requests with arbitrary extensions', async () => {
    const resolveId = vi.fn((id: string) => {
      if (id === '/nested/entry.data?raw&label=hello world') {
        return OUTSIDE_HTML_PATH + '?raw'
      }
    })
    const server = await createTestServer(undefined, [
      { name: 'resolve-html-script', enforce: 'pre', resolveId },
    ])
    server.config.server.fs.allow = []
    server.config.server.preTransformRequests = false

    await server.transformIndexHtml(
      '/nested/index.html',
      '<script type="module" src="./entry.data?raw&label=hello%20world&import#part"></script>',
    )

    expect(resolveId.mock.calls.map(([id]) => id)).toContain(
      '/nested/entry.data?raw&label=hello world',
    )
    expect(server.config.safeModulePaths).toContain(OUTSIDE_HTML_PATH + '?raw')
    expect(server.config.safeModulePaths).not.toContain(
      normalizePath(path.join(FIXTURE_DIR, 'root/nested/entry.data')),
    )
    expect(
      await server.environments.client.transformRequest(
        '/nested/entry.data?raw&label=hello world',
      ),
    ).not.toBeNull()
  })

  test('maps static requests without running plugin resolution', async () => {
    const resolveId = vi.fn((id: string) => {
      if (id === '/image.svg') return OUTSIDE_HTML_PATH + '?raw'
    })
    const server = await createTestServer(undefined, [
      {
        name: 'resolve-html-image',
        enforce: 'pre',
        resolveId,
        config() {
          return {
            resolve: {
              alias: { '/images': '/static' },
            },
          }
        },
      },
    ])
    server.config.server.fs.allow = []
    server.config.server.preTransformRequests = false

    await server.transformIndexHtml(
      '/index.html',
      '<img src="/image.svg"><img src="/images/icon.svg">',
    )

    expect(resolveId.mock.calls.map(([id]) => id)).not.toContain('/image.svg')
    expect(server.config.safeModulePaths).toContain(
      normalizePath(path.join(FIXTURE_DIR, 'root/image.svg')),
    )
    expect(server.config.safeModulePaths).toContain(
      normalizePath(path.join(FIXTURE_DIR, 'root/static/icon.svg')),
    )
    expect(server.config.safeModulePaths).not.toContain(OUTSIDE_HTML_PATH)
    expect(server.config.safeModulePaths).not.toContain('/static/icon.svg')
  })

  test('registers plugin targets before warming HTML dependencies', async () => {
    const server = await createTestServer(undefined, [
      {
        name: 'resolve-warmed-script',
        enforce: 'pre',
        async resolveId(id) {
          if (id === '/entry.js?raw') return OUTSIDE_HTML_PATH + '?raw'
        },
      },
    ])
    server.config.server.fs.allow = []
    const warmupRequest = vi
      .spyOn(server, 'warmupRequest')
      .mockImplementation(async (url) => {
        if (url === '/entry.js?raw') {
          expect(server.config.safeModulePaths).toContain(
            OUTSIDE_HTML_PATH + '?raw',
          )
          expect(
            await server.environments.client.transformRequest(url),
          ).not.toBeNull()
        }
      })

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="/entry.js?raw"></script>',
    )

    expect(warmupRequest).toHaveBeenCalledWith('/entry.js?raw')
    await Promise.all(warmupRequest.mock.results.map(({ value }) => value))
  })

  test('maps configured iframe sources as document requests', async () => {
    const resolveId = vi.fn((id: string) => {
      if (id === '/classic.js') return OUTSIDE_HTML_PATH
    })
    const server = await createTestServer(undefined, [
      {
        name: 'resolve-frame-source',
        enforce: 'pre',
        resolveId,
        config() {
          return {
            html: {
              additionalAssetSources: {
                iframe: { srcAttributes: ['src'] },
              },
            },
          }
        },
      },
    ])
    server.config.server.fs.allow = []
    server.config.server.preTransformRequests = false

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
    const server = await createTestServer(undefined, [
      {
        name: 'alias-html-stylesheets',
        config() {
          return {
            resolve: {
              alias: {
                '/@': path.join(FIXTURE_DIR, 'root'),
              },
            },
          }
        },
      },
    ])
    server.config.server.fs.allow = []

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
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                attrs: { type: 'module', src: './dynamic.js?url' },
              },
            ]
          },
        },
      },
    ])

    await server.transformIndexHtml(
      '/index.html',
      '<script type="module" src="classic.js?raw"></script>',
    )

    for (const file of ['classic.js?raw', 'dynamic.js?url']) {
      expect(server.config.safeModulePaths).toContain(
        normalizePath(path.join(FIXTURE_DIR, 'root', file)),
      )
    }
    expect(server.config.safeModulePaths).not.toContain(
      normalizePath(OUTSIDE_HTML_PATH),
    )
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
        name: 'source HTML tags',
        html: `
          <link rel="stylesheet" href="./style.css?direct">
          <script type="module" src="./classic.js?raw"></script>
          <script>import('./dynamic.js?url')</script>
        `,
        plugins: [],
        files: ['style.css?direct', 'classic.js?raw', 'dynamic.js?url'],
      },
      {
        name: 'tags injected by a pre hook',
        html: HTML_CONTENT,
        plugins: [
          {
            name: 'inject-safe-module-tags',
            transformIndexHtml: {
              order: 'pre',
              handler() {
                return [
                  {
                    tag: 'link',
                    attrs: { rel: 'stylesheet', href: './style.css?direct' },
                  },
                  {
                    tag: 'script',
                    attrs: { type: 'module', src: './classic.js?raw' },
                  },
                ]
              },
            },
          },
        ],
        files: ['style.css?direct', 'classic.js?raw'],
      },
      {
        name: 'HTML returned by a pre hook',
        html: HTML_CONTENT,
        plugins: [
          {
            name: 'inject-html-reference',
            transformIndexHtml: {
              order: 'pre',
              handler(html) {
                return (
                  html + '<script type="module" src="/classic.js?raw"></script>'
                )
              },
            },
          },
        ],
        files: ['classic.js?raw'],
      },
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
        const server = await createTestServer(undefined, plugins, base)
        server.config.server.preTransformRequests = false

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

  test.each([undefined, 'post'] as const)(
    'does not register source references injected by a hook with order %s',
    async (order) => {
      const server = await createTestServer(undefined, [
        {
          name: 'inject-html-source-references',
          transformIndexHtml: {
            order,
            handler: () => `
              <script type="module" src="/classic.js?raw"></script>
              <script>import('/dynamic.js?url')</script>
              <link rel="stylesheet" href="/style.css?direct">
              <img src="/classic.js?image" srcset="/dynamic.js?small 1x, /dynamic.js?large 2x">
            `,
          },
        },
      ])

      await server.transformIndexHtml('/index.html', '')

      for (const file of ['classic.js', 'dynamic.js', 'style.css']) {
        expect(server.config.safeModulePaths).not.toContain(
          normalizePath(path.join(FIXTURE_DIR, 'root', file)),
        )
      }
    },
  )
})
