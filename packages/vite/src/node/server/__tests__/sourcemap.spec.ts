import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { isWindows } from '../../../shared/utils'
import { createLogger } from '../../logger'
import { normalizePath } from '../../utils'
import {
  getNodeModulesPackageRoot,
  injectSourcesContent,
  rebaseCssSourcemapSources,
  type SourceMapLike,
} from '../sourcemap'

describe('style tag sourcemap sources', () => {
  const root = normalizePath(path.resolve('project'))
  const file = path.join(root, 'nested/dir/from-js.css')

  test('resolves in-root sources from both root and nested pages', () => {
    const map: SourceMapLike = {
      sources: [file, path.join(root, 'nested/dir/dep.css')],
      sourcesContent: ['.from-js {}', '.dep {}'],
    }
    rebaseCssSourcemapSources(map, file, root, '/')

    expect(map.sources).toEqual([
      '/nested/dir/from-js.css',
      '/nested/dir/dep.css',
    ])
    for (const page of [
      'http://localhost/',
      'http://localhost/admin/index.html',
    ]) {
      expect(new URL(map.sources[1], page).pathname).toBe('/nested/dir/dep.css')
    }
    expect(map.sourcesContent).toEqual(['.from-js {}', '.dep {}'])
  })

  test('includes the configured base and encodes spaces and percent signs', () => {
    const map: SourceMapLike = { sources: [path.join(root, 'a b%/dep.css')] }
    rebaseCssSourcemapSources(map, file, root, '/base/')
    expect(map.sources).toEqual(['/base/a%20b%25/dep.css'])
  })

  test('keeps out-of-root files as distinct labels', () => {
    const outside = normalizePath(path.resolve(root, '../shared/dep.css'))
    const sibling = normalizePath(path.resolve(root, '../project-copy/dep.css'))
    const map: SourceMapLike = { sources: [outside, sibling] }
    rebaseCssSourcemapSources(map, file, root, '/')
    expect(map.sources).toEqual([outside, sibling])
  })

  test('preserves virtual and remote sources', () => {
    const sources = [
      '\0virtual.css',
      `${root}/\0virtual.css`,
      'virtual:style.css',
      'dep:style.css',
      'browser-external:style.css',
      'https://example.com/style.css',
      'vite://client/style.css',
      'data:text/css,.foo{}',
      '',
    ]
    const map: SourceMapLike = { sources: [...sources] }
    rebaseCssSourcemapSources(map, file, root, '/')
    expect(map.sources).toEqual(sources)
  })

  test('resolves a local sourceRoot before rebasing', () => {
    const map: SourceMapLike = { sources: ['dep.css'], sourceRoot: '../src' }
    rebaseCssSourcemapSources(map, file, root, '/')
    expect(map.sources).toEqual(['/nested/src/dep.css'])
    expect(map.sourceRoot).toBeUndefined()
  })

  test('preserves maps with a remote sourceRoot', () => {
    const map: SourceMapLike = {
      sources: ['dep.css'],
      sourceRoot: 'https://example.com/src/',
    }
    rebaseCssSourcemapSources(map, file, root, '/')
    expect(map).toEqual({
      sources: ['dep.css'],
      sourceRoot: 'https://example.com/src/',
    })
  })
})

describe('getNodeModulesPackageRoot', () => {
  const cases = [
    {
      name: 'returns undefined for path outside node_modules',
      input: '/project/src/foo.ts',
      expected: undefined,
    },
    {
      name: 'returns undefined for plain filename',
      input: 'foo.js',
      expected: undefined,
    },
    {
      name: 'unscoped package',
      input: '/project/node_modules/foo/index.js',
      expected: '/project/node_modules/foo',
    },
    {
      name: 'unscoped package in nested directory',
      input: '/project/node_modules/foo/dist/bar.js',
      expected: '/project/node_modules/foo',
    },
    {
      name: 'scoped package',
      input: '/project/node_modules/@scope/pkg/dist/foo.js',
      expected: '/project/node_modules/@scope/pkg',
    },
    {
      name: 'scoped package at root level',
      input: '/project/node_modules/@scope/pkg/index.js',
      expected: '/project/node_modules/@scope/pkg',
    },
    {
      name: 'nested node_modules uses the last segment',
      input: '/project/node_modules/foo/node_modules/bar/index.js',
      expected: '/project/node_modules/foo/node_modules/bar',
    },
    {
      name: 'Windows-style path',
      input: 'D:\\project\\node_modules\\foo\\dist\\bar.js',
      expected: 'D:/project/node_modules/foo',
      skip: !isWindows,
    },
    {
      name: 'Windows-style path with scoped package',
      input: 'D:\\project\\node_modules\\@scope\\pkg\\index.js',
      expected: 'D:/project/node_modules/@scope/pkg',
      skip: !isWindows,
    },
    {
      name: 'package name without subdirectory',
      input: '/project/node_modules/foo',
      expected: '/project/node_modules/foo',
    },
    {
      name: 'scoped package name without subdirectory',
      input: '/project/node_modules/@scope/pkg',
      expected: '/project/node_modules/@scope/pkg',
    },
  ]

  for (const { name, input, expected, skip } of cases) {
    test.skipIf(skip)(name, () => {
      expect(getNodeModulesPackageRoot(input)).toBe(expected)
    })
  }
})

describe('injectSourcesContent', () => {
  function createMockLogger() {
    const logger = createLogger()
    logger.warnOnce = vi.fn()
    return logger
  }

  test('leaves maps with a remote sourceRoot alone', async () => {
    const map: SourceMapLike = {
      sources: ['index.ts'],
      sourceRoot: 'https://raw.githubusercontent.com/fb55/domutils/abc123/src/',
    }
    const logger = createMockLogger()

    await injectSourcesContent(
      map,
      '/project/node_modules/domutils/lib/esm/index.js',
      logger,
    )

    expect(logger.warnOnce).not.toHaveBeenCalled()
    expect(map.sourcesContent).toBeUndefined()
  })

  test('does not inject content for remote sources', async () => {
    const map: SourceMapLike = {
      sources: [
        'https://raw.githubusercontent.com/fb55/domutils/abc123/src/index.ts',
      ],
    }
    const logger = createMockLogger()

    await injectSourcesContent(
      map,
      '/project/node_modules/domutils/lib/esm/index.js',
      logger,
    )

    expect(logger.warnOnce).not.toHaveBeenCalled()
    expect(map.sourcesContent).toStrictEqual([])
  })

  test('warns for sources that resolve outside the package', async () => {
    const map: SourceMapLike = {
      sources: ['/outside/project/index.ts'],
    }
    const logger = createMockLogger()

    await injectSourcesContent(
      map,
      '/project/node_modules/foo/dist/index.js',
      logger,
    )

    expect(logger.warnOnce).toHaveBeenCalledOnce()
    expect(map.sourcesContent).toStrictEqual([null])
  })
})
