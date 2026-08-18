import { describe, expect, test } from 'vitest'
import type { ResolvedConfig } from '../../../config'
import { isFileInTargetPath, isFileLoadingAllowed } from '../static'

describe('isFileInTargetPath', () => {
  const cases = {
    '/parent': {
      '/parent': true,
      '/parenta': false,
      '/parent/': true,
      '/parent/child': true,
      '/parent/child/child2': true,
    },
    '/parent/': {
      '/parent': false,
      '/parenta': false,
      '/parent/': true,
      '/parent/child': true,
      '/parent/child/child2': true,
    },
  }

  for (const [parent, children] of Object.entries(cases)) {
    for (const [child, expected] of Object.entries(children)) {
      test(`isFileInTargetPath("${parent}", "${child}")`, () => {
        expect(isFileInTargetPath(parent, child)).toBe(expected)
      })
    }
  }
})

describe('isFileLoadingAllowed', () => {
  test('treats query syntax as part of the file path', () => {
    const safeFilePath = '/foo/bar'
    const config = {
      server: { fs: { strict: true, allow: [] } },
      fsDenyGlob: () => false,
      safeModulePaths: new Set([safeFilePath]),
    } as ResolvedConfig

    expect(isFileLoadingAllowed(config, safeFilePath)).toBe(true)
    expect(isFileLoadingAllowed(config, `${safeFilePath}?baz`)).toBe(false)
  })
})
