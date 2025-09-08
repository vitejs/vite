import { describe, expect, test } from 'vitest'
import { isUriInFilePath } from '../static'

describe('isUriInFilePath', () => {
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
      test(`isUriInFilePath("${parent}", "${child}")`, () => {
        expect(isUriInFilePath(parent, child)).toBe(expected)
      })
    }
  }
})
