import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import type { ViteDevServer } from '../../server'
import { normalizePath } from '../../utils'
import {
  addHtmlRequestToSafeModulePaths,
  getHtmlAssetFetchDest,
  htmlUrlToRequestUrl,
} from '../htmlSafeModulePaths'
import { SafeModulePaths } from '../safeModulePaths'

const root = normalizePath(path.resolve('/project/root'))
const outsideHtmlPath = normalizePath(path.resolve('/project/outside.html'))
const outsideHtmlUrl = path.posix.join('/@fs/', outsideHtmlPath)

function createServerStub(base = '/') {
  return {
    config: {
      root,
      base,
      publicDir: false,
      resolve: { alias: [], preserveSymlinks: true },
      safeModulePaths: new SafeModulePaths(),
    },
    environments: {
      client: {
        pluginContainer: { resolveId: vi.fn().mockResolvedValue(null) },
      },
    },
  } as unknown as ViteDevServer
}

describe('htmlUrlToRequestUrl', () => {
  test.each([
    ['/index.html', './classic.js?raw', '/classic.js?raw'],
    ['/index.html', '/classic.js?raw#part', '/classic.js?raw'],
    ['/index.html', '../classic.js?raw', '/classic.js?raw'],
    ['/nested/index.html', './classic.js?raw', '/nested/classic.js?raw'],
    ['/nested/index.html', 'classic.js?raw', '/nested/classic.js?raw'],
    ['/nested/index.html', '../classic.js?raw', '/classic.js?raw'],
    ['/nested/index.html', '/classic.js?raw', '/classic.js?raw'],
    ['/nested/', './classic.js?raw', '/nested/classic.js?raw'],
    ['/nested/?q=1', './classic.js?raw', '/nested/classic.js?raw'],
    ['/nested/index.html', './a%20b.js?raw', '/nested/a%20b.js?raw'],
    [
      '/nested/index.html',
      './classic.js?path=/../file',
      '/nested/classic.js?path=/../file',
    ],
    [
      outsideHtmlUrl,
      './classic.js?raw',
      path.posix.join(
        '/@fs/',
        path.posix.dirname(outsideHtmlPath),
        'classic.js',
      ) + '?raw',
    ],
    ['/index.html', `${outsideHtmlUrl}?raw`, `${outsideHtmlUrl}?raw`],
    ['/index.html', '/ui/classic.js?raw', '/classic.js?raw', '/ui/'],
    ['/index.html', '/ui/ui/classic.js?raw', '/ui/classic.js?raw', '/ui/'],
    ['/index.html', './classic.js?raw', '/classic.js?raw', '/ui/'],
    ['/index.html', '/src/src/main.ts', '/src/main.ts', '/src/'],
    ['/index.html', '../outside.html', '/outside.html'],
  ])(
    'resolves %s with %s to %s (base: %s)',
    (htmlPath, url, expected, base = '/') => {
      expect(
        htmlUrlToRequestUrl(url, {
          path: htmlPath,
          server: createServerStub(base),
        }),
      ).toBe(expected)
    },
  )

  test.each(['/ui/', '/a%20b/', '/%E3%81%82/'])(
    'uses the browser document location with base %s',
    (base) => {
      expect(
        htmlUrlToRequestUrl('./image.svg?size=2#icon', {
          path: '/other/index.html',
          originalUrl: `${base}client/route`,
          server: createServerStub(base),
        }),
      ).toBe('/client/image.svg?size=2')
    },
  )
})

describe('getHtmlAssetFetchDest', () => {
  test.each<{
    tag: string
    attributes: Record<string, string>
    expected: string
  }>([
    { tag: 'link', attributes: { rel: 'stylesheet' }, expected: 'style' },
    { tag: 'link', attributes: { rel: ' MODULEPRELOAD ' }, expected: 'script' },
    {
      tag: 'link',
      attributes: { rel: 'preload', as: 'SCRIPT' },
      expected: 'script',
    },
  ])(
    'maps $tag with $attributes to $expected',
    ({ tag, attributes, expected }) => {
      expect(getHtmlAssetFetchDest(tag, 'href', attributes)).toBe(expected)
    },
  )

  test.each(['iframe', 'frame', 'fencedframe'])(
    'maps %s sources to document requests',
    (tag) => {
      expect(getHtmlAssetFetchDest(tag, 'src', {})).toBe(tag)
    },
  )
})

describe('addHtmlRequestToSafeModulePaths', () => {
  test.each([
    ['/classic.js?raw', `${root}/classic.js?raw`],
    ['/nested/classic.js?raw', `${root}/nested/classic.js?raw`],
    ['/nested/a%20b.js?raw', `${root}/nested/a b.js?raw`],
    [
      '/nested/classic.js?path=/../file',
      `${root}/nested/classic.js?path=/../file`,
    ],
    [
      path.posix.join(
        '/@fs/',
        path.posix.dirname(outsideHtmlPath),
        'classic.js',
      ) + '?raw',
      path.posix.join(path.posix.dirname(outsideHtmlPath), 'classic.js?raw'),
    ],
    [`${outsideHtmlUrl}?raw`, `${outsideHtmlPath}?raw`],
    ['/ui/classic.js?raw', `${root}/ui/classic.js?raw`],
    ['/src/main.ts', `${root}/src/main.ts`],
    ['/outside.html', `${root}/outside.html`],
    ['/client/image.svg?size=2', `${root}/client/image.svg?size=2`],
  ])('registers %s as %s', async (requestUrl, expected) => {
    const server = createServerStub()

    await addHtmlRequestToSafeModulePaths(requestUrl, server)

    expect(new Set(server.config.safeModulePaths)).toEqual(
      new Set([expected, expected.split('?', 1)[0]]),
    )
  })

  test('maps static requests without running plugin resolution', async () => {
    const server = createServerStub()
    server.config.resolve.alias = [{ find: '/images', replacement: '/static' }]
    const resolveId = vi.mocked(
      server.environments.client.pluginContainer.resolveId,
    )
    resolveId.mockResolvedValue({ id: `${outsideHtmlPath}?raw` })

    await addHtmlRequestToSafeModulePaths('/image.svg', server)
    await addHtmlRequestToSafeModulePaths('/images/icon.svg', server)

    expect(resolveId).not.toHaveBeenCalled()
    expect(new Set(server.config.safeModulePaths)).toEqual(
      new Set([`${root}/image.svg`, `${root}/static/icon.svg`]),
    )
  })
})
