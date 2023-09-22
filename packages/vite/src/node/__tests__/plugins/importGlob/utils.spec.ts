import { describe, expect, it } from 'vitest'
import { getCommonBase } from '../../../plugins/importMetaGlob'

describe('getCommonBase()', async () => {
  it('basic', () => {
    expect(getCommonBase(['/a/b/*.js', '/a/c/*.js'])).toBe('/a')
  })
  it('common base', () => {
    expect(getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx'])).toBe('/a/b')
  })
  it('static file', () => {
    expect(
      getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx', '/a/b/foo.js']),
    ).toBe('/a/b')
    expect(getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx', '/a/foo.js'])).toBe(
      '/a',
    )
  })
  it('correct `scan()`', () => {
    expect(getCommonBase(['/a/*.vue'])).toBe('/a')
    expect(getCommonBase(['/a/some.vue'])).toBe('/a')
    expect(getCommonBase(['/a/b/**/c/foo.vue', '/a/b/c/**/*.jsx'])).toBe('/a/b')
  })
  it('single', () => {
    expect(getCommonBase(['/a/b/c/*.vue'])).toBe('/a/b/c')
    expect(getCommonBase(['/a/b/c/foo.vue'])).toBe('/a/b/c')
  })
  it('no common base', () => {
    expect(getCommonBase(['/a/b/*.js', '/c/a/b/*.js'])).toBe('/')
  })
})
