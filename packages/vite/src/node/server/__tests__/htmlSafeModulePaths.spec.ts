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

function createServerStub() {
  return {
    config: {
      root,
      base: '/',
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
  const cases = [
    {
      htmlPath: '/index.html',
      url: './classic.js?raw',
      expected: '/classic.js?raw',
    },
    {
      htmlPath: '/index.html',
      url: '/classic.js?raw#part',
      expected: '/classic.js?raw',
    },
    {
      htmlPath: '/index.html',
      url: '../classic.js?raw',
      expected: '/classic.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: './classic.js?raw',
      expected: '/nested/classic.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: 'classic.js?raw',
      expected: '/nested/classic.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: '../classic.js?raw',
      expected: '/classic.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: '/classic.js?raw',
      expected: '/classic.js?raw',
    },
    {
      htmlPath: '/nested/',
      url: './classic.js?raw',
      expected: '/nested/classic.js?raw',
    },
    {
      htmlPath: '/nested/?q=1',
      url: './classic.js?raw',
      expected: '/nested/classic.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: './a%20b.js?raw',
      expected: '/nested/a%20b.js?raw',
    },
    {
      htmlPath: '/nested/index.html',
      url: './classic.js?path=/../file',
      expected: '/nested/classic.js?path=/../file',
    },
    {
      htmlPath: outsideHtmlUrl,
      url: './classic.js?raw',
      expected:
        path.posix.join(
          '/@fs/',
          path.posix.dirname(outsideHtmlPath),
          'classic.js',
        ) + '?raw',
    },
    {
      htmlPath: '/index.html',
      url: `${outsideHtmlUrl}?raw`,
      expected: `${outsideHtmlUrl}?raw`,
    },
    {
      htmlPath: '/index.html',
      url: '/ui/classic.js?raw',
      expected: '/classic.js?raw',
      base: '/ui/',
    },
    {
      htmlPath: '/index.html',
      url: '/ui/ui/classic.js?raw',
      expected: '/ui/classic.js?raw',
      base: '/ui/',
    },
    {
      htmlPath: '/index.html',
      url: './classic.js?raw',
      expected: '/classic.js?raw',
      base: '/ui/',
    },
    {
      htmlPath: '/index.html',
      url: '/src/src/main.ts',
      expected: '/src/main.ts',
      base: '/src/',
    },
    {
      htmlPath: '/index.html',
      url: '../outside.html',
      expected: '/outside.html',
    },
  ]

  for (const { htmlPath, url, expected, base = '/' } of cases) {
    test(`resolves ${htmlPath} with ${url} to ${expected} (base: ${base})`, () => {
      expect(
        htmlUrlToRequestUrl(url, base, {
          path: htmlPath,
        }),
      ).toBe(expected)
    })
  }

  for (const base of ['/ui/', '/a%20b/', '/%E3%81%82/']) {
    test(`uses the browser document location with base ${base}`, () => {
      expect(
        htmlUrlToRequestUrl('./image.svg?size=2#icon', base, {
          path: '/other/index.html',
          originalUrl: `${base}client/route`,
        }),
      ).toBe('/client/image.svg?size=2')
    })
  }
})

describe('getHtmlAssetFetchDest', () => {
  const cases: {
    tag: string
    attributes: Record<string, string>
    expected: string
  }[] = [
    { tag: 'link', attributes: { rel: 'stylesheet' }, expected: 'style' },
    { tag: 'link', attributes: { rel: ' MODULEPRELOAD ' }, expected: 'script' },
    {
      tag: 'link',
      attributes: { rel: 'preload', as: 'SCRIPT' },
      expected: 'script',
    },
  ]
  for (const { tag, attributes, expected } of cases) {
    test(`maps ${tag} with ${JSON.stringify(attributes)} to ${expected}`, () => {
      expect(getHtmlAssetFetchDest(tag, 'href', attributes)).toBe(expected)
    })
  }

  for (const tag of ['iframe', 'frame', 'fencedframe']) {
    test(`maps ${tag} sources to document requests`, () => {
      expect(getHtmlAssetFetchDest(tag, 'src', {})).toBe(tag)
    })
  }
})

describe('addHtmlRequestToSafeModulePaths', () => {
  const cases = [
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
  ]

  for (const [requestUrl, expected] of cases) {
    test(`registers ${requestUrl} as ${expected}`, async () => {
      const server = createServerStub()

      await addHtmlRequestToSafeModulePaths(requestUrl, server)

      expect(new Set(server.config.safeModulePaths)).toEqual(
        new Set([expected, expected.split('?', 1)[0]]),
      )
    })
  }

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
