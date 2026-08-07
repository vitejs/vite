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
  const shortNamePaths = {
    // classic 8.3 short names
    'C:/PROGRA~1/x': true,
    'C:/PROGRA~1': true,
    'C:/LONGFI~1.TXT': true,
    'C:/MICROS~2/foo': true,
    // short-name-looking directory ancestor, not just the basename
    'C:/foo/DOCUME~1/bar.js': true,
  }
  const legitimateTildePaths = {
    // real-world case from the reported issue: `~` not followed by a digit
    'C:/project/dist/0~rslib-runtime.js': false,
    // ancestor directory containing a tilde that isn't short-name shaped
    'C:/Users/foo~bar/project/index.js': false,
    // tilde-prefixed name with no short-name-style prefix/digit suffix
    'C:/Users/foo/~backup/index.js': false,
    // prefix longer than the 6 characters a short name can have
    'C:/project/confirmations~2/index.js': false,
    // no tilde at all
    'C:/Users/foo/project/index.js': false,
  }

  for (const [filePath, expected] of Object.entries(shortNamePaths)) {
    test(`looksLikeWindowsShortNamePath("${filePath}") is ${expected}`, () => {
      expect(looksLikeWindowsShortNamePath(filePath)).toBe(expected)
    })
  }
  for (const [filePath, expected] of Object.entries(legitimateTildePaths)) {
    test(`looksLikeWindowsShortNamePath("${filePath}") is ${expected}`, () => {
      expect(looksLikeWindowsShortNamePath(filePath)).toBe(expected)
    })
  }
})
