import { describe, expect, test } from 'vitest'
import {
  getNodeModulesPackageRoot,
  rewriteModuleSourceMapSources,
} from '../sourcemap'
import { isWindows } from '../../../shared/utils'

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

describe.skipIf(isWindows)('rewriteModuleSourceMapSources', () => {
  test('makes absolute paths relative to the module', () => {
    const map = {
      sources: ['/project/src/a.ts', '/project/src/nested/b.ts'],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual(['a.ts', 'nested/b.ts'])
  })

  test('URL-encodes whitespace in the resulting relative path (#17977)', () => {
    // Simulates macOS iCloud paths like `~/Library/Mobile Documents/…`.
    const map = {
      sources: ['/Users/foo/My Project/src/a.ts'],
    }
    rewriteModuleSourceMapSources(map, '/Users/foo/My Project/src/entry.ts')
    expect(map.sources).toEqual(['a.ts'])

    const map2 = {
      sources: ['/Users/foo/My Project/src/a.ts'],
    }
    rewriteModuleSourceMapSources(map2, '/tmp/entry.ts')
    expect(map2.sources[0]).not.toContain(' ')
    expect(map2.sources[0]).toContain('%20')
    expect(map2.sources[0]).toBe('../Users/foo/My%20Project/src/a.ts')
  })

  test('URL-encodes whitespace in already-relative sources', () => {
    const map = {
      sources: ['../my dir/a.ts'],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual(['../my%20dir/a.ts'])
  })

  test('escapes `#`, which encodeURI leaves as-is', () => {
    const map = {
      sources: ['../my#dir/a.ts', '/project/c#1/d.ts'],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual(['../my%23dir/a.ts', '../c%231/d.ts'])
  })

  test('preserves query strings', () => {
    const map = {
      sources: ['my-worker.ts?worker_file&type=module', './a.ts?v=123'],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual([
      'my-worker.ts?worker_file&type=module',
      './a.ts?v=123',
    ])
  })

  test('leaves virtual sources untouched', () => {
    const map = {
      sources: [
        '\0virtual-mod',
        'virtual:my-mod',
        'dep:foo',
        'browser-external:bar',
      ],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual([
      '\0virtual-mod',
      'virtual:my-mod',
      'dep:foo',
      'browser-external:bar',
    ])
  })

  test('preserves empty entries', () => {
    const map = {
      sources: ['', '/project/src/a.ts'],
    }
    rewriteModuleSourceMapSources(map, '/project/src/entry.ts')
    expect(map.sources).toEqual(['', 'a.ts'])
  })

  test('is a no-op when the module file is not absolute', () => {
    const map = {
      sources: ['/absolute/src/a.ts', '../relative with space/b.ts'],
    }
    rewriteModuleSourceMapSources(map, 'not-absolute.ts')
    expect(map.sources).toEqual([
      '/absolute/src/a.ts',
      '../relative with space/b.ts',
    ])
  })
})
