import { describe, expect, test } from 'vitest'
import { isFileInTargetPath, looksLikeWindowsShortNamePath } from '../static'

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

describe('looksLikeWindowsShortNamePath', () => {
  const shortNamePaths = [
    // classic 8.3 short names
    'C:/PROGRA~1/x',
    'C:/PROGRA~1',
    'C:/LONGFI~1.TXT',
    'C:/MICROS~2/foo',
    // short-name-looking directory ancestor, not just the basename
    'C:/foo/DOCUME~1/bar.js',
  ]
  const legitimateTildePaths = [
    // real-world case from the reported issue: `~` not followed by a digit
    'C:/project/dist/0~rslib-runtime.js',
    // ancestor directory containing a tilde that isn't short-name shaped
    'C:/Users/foo~bar/project/index.js',
    // tilde-prefixed name with no short-name-style prefix/digit suffix
    'C:/Users/foo/~backup/index.js',
    // prefix longer than the 6 characters a short name can have
    'C:/project/confirmations~2/index.js',
    // no tilde at all
    'C:/Users/foo/project/index.js',
  ]

  for (const filePath of shortNamePaths) {
    test(`looksLikeWindowsShortNamePath("${filePath}") is true`, () => {
      expect(looksLikeWindowsShortNamePath(filePath)).toBe(true)
    })
  }
  for (const filePath of legitimateTildePaths) {
    test(`looksLikeWindowsShortNamePath("${filePath}") is false`, () => {
      expect(looksLikeWindowsShortNamePath(filePath)).toBe(false)
    })
  }
})
