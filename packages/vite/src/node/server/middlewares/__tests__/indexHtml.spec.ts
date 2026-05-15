import { describe, expect, test } from 'vitest'
import { resolveHtmlAttrUrl } from '../indexHtml'

const makeConfig = (alias: { find: string | RegExp; replacement: string }[]) =>
  ({ resolve: { alias } }) as Parameters<typeof resolveHtmlAttrUrl>[1]

describe('resolveHtmlAttrUrl (#17910)', () => {
  test('passes through absolute URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('/main.js', config)).toBe('/main.js')
  })

  test('passes through relative URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('./main.js', config)).toBe('./main.js')
    expect(resolveHtmlAttrUrl('../main.js', config)).toBe('../main.js')
  })

  test('passes through external URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('https://example.com/x.js', config)).toBe(
      'https://example.com/x.js',
    )
    expect(resolveHtmlAttrUrl('//example.com/x.js', config)).toBe(
      '//example.com/x.js',
    )
  })

  test('passes through data URLs unchanged', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('data:image/png;base64,abc', config)).toBe(
      'data:image/png;base64,abc',
    )
  })

  test('resolves a string alias that does not start with /', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe('/@fs/abs/src/main.js')
  })

  test('resolves a regex alias that does not start with /', () => {
    const config = makeConfig([{ find: /^~/, replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('~/main.js', config)).toBe('/@fs/abs/src/main.js')
  })

  test('does not match an alias when the url does not start with the find string', () => {
    const config = makeConfig([{ find: '@', replacement: '/abs/src' }])
    expect(resolveHtmlAttrUrl('foo@bar.js', config)).toBe('foo@bar.js')
  })

  test('returns alias replacement as-is when not absolute', () => {
    const config = makeConfig([{ find: '@', replacement: 'relative/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe('relative/src/main.js')
  })

  test('normalizes a Windows absolute path with forward slashes', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('C:/abs/path/main.js', config)).toBe(
      '/@fs/C:/abs/path/main.js',
    )
  })

  test('normalizes a Windows absolute path with backslashes', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('C:\\abs\\path\\main.js', config)).toBe(
      '/@fs/C:/abs/path/main.js',
    )
  })

  test('normalizes a Windows absolute path through an alias', () => {
    const config = makeConfig([{ find: '@', replacement: 'C:/abs/src' }])
    expect(resolveHtmlAttrUrl('@/main.js', config)).toBe(
      '/@fs/C:/abs/src/main.js',
    )
  })

  test('Windows volume check is case-insensitive on the drive letter', () => {
    const config = makeConfig([])
    expect(resolveHtmlAttrUrl('d:/abs/path/main.js', config)).toBe(
      '/@fs/d:/abs/path/main.js',
    )
  })
})
