import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer } from '../../../server'
import { FS_PREFIX } from '../../../constants'
import { resolveHtmlAttrUrl } from '../indexHtml'

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

const makeConfig = (alias: { find: string | RegExp; replacement: string }[]) =>
  ({ resolve: { alias } }) as Parameters<typeof resolveHtmlAttrUrl>[1]

describe('resolveHtmlAttrUrl (#17910)', () => {
  test('passes through absolute URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('/main.js', config)).toBe('/main.js')
  })

  test('passes through relative URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('./main.js', config)).toBe('./main.js')
    expect(resolveHtmlAttrUrl('../main.js', config)).toBe('../main.js')
  })

  test('passes through external URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('https://example.com/x.js', config)).toBe(
      'https://example.com/x.js',
    )
    expect(resolveHtmlAttrUrl('//example.com/x.js', config)).toBe(
      '//example.com/x.js',
    )
  })

  test('passes through data URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('data:image/png;base64,abc', config)).toBe(
      'data:image/png;base64,abc',
    )
  })

  test('resolves a string alias that does not start with /', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe('/@fs/abs/src/main.js')
  })

  test('resolves a regex alias that does not start with /', () => {
    const config = makeConfig([{ find: /^~/, replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('~/main.js', config)).toBe('/@fs/abs/src/main.js')
  })

  test('does not match an alias when the url does not start with the find string', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('foo@bar.js', config)).toBe('foo@bar.js')
  })

  test('returns alias replacement as-is when not absolute', () => {
    const config = makeConfig([{ find: '@', replacement: 'relative/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe('relative/src/main.js')
  })

  test('normalizes a Windows absolute path with forward slashes', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('C:/abs/path/main.js', config)).toBe(
      '/@fs/C:/abs/path/main.js',
    )
  })

  test('normalizes a Windows absolute path with backslashes', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('C:\\abs\\path\\main.js', config)).toBe(
      '/@fs/C:/abs/path/main.js',
    )
  })

  test('normalizes a Windows absolute path through an alias', () => {
    const config = makeConfig([{ find: '@', replacement: 'C:/abs/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe(
      '/@fs/C:/abs/src/main.js',
    )
  })

  test('Windows volume check is case-insensitive on the drive letter', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('d:/abs/path/main.js', config)).toBe(
      '/@fs/d:/abs/path/main.js',
    )
  })
})
