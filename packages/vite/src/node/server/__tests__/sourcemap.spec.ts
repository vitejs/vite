import { describe, expect, test } from 'vitest'
import { getNodeModulesPackageRoot } from '../sourcemap'
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
