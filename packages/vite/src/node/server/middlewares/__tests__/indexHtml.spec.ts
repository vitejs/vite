import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { getHtmlDirnameForRelativeUrl } from '../indexHtml'

describe('getHtmlDirnameForRelativeUrl', () => {
  test('keeps trailing slash paths unchanged', () => {
    expect(getHtmlDirnameForRelativeUrl('/example/dir/')).toBe('/example/dir/')
  })

  test('returns dirname for html files', () => {
    expect(getHtmlDirnameForRelativeUrl('/example/dir/index.html')).toBe(
      '/example/dir',
    )
  })

  test('preserves root path', () => {
    expect(getHtmlDirnameForRelativeUrl('/')).toBe('/')
  })

  test('resolves relative script from trailing slash directory', () => {
    const preTransformUrl = path.posix.join(
      '/',
      getHtmlDirnameForRelativeUrl('/example/dir/'),
      './filename.js',
    )

    expect(preTransformUrl).toBe('/example/dir/filename.js')
  })
})
