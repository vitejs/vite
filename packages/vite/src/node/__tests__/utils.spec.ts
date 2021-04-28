import { injectQuery, isJSRequest } from '../utils'

const isWindows = process.platform === 'win32'

describe('injectQuery', () => {
  if (isWindows) {
    // this test will work incorrectly on unix systems
    test('normalize windows path', () => {
      expect(injectQuery('C:\\User\\Vite\\Project', 'direct')).toEqual(
        'C:/User/Vite/Project?direct'
      )
    })
  }

  test('path with multiple spaces', () => {
    expect(injectQuery('/usr/vite/path with space', 'direct')).toEqual(
      '/usr/vite/path with space?direct'
    )
  })

  test('path with multiple % characters', () => {
    expect(injectQuery('/usr/vite/not%20a%20space', 'direct')).toEqual(
      '/usr/vite/not%20a%20space?direct'
    )
  })

  test('path with %25', () => {
    expect(injectQuery('/usr/vite/%25hello%25', 'direct')).toEqual(
      '/usr/vite/%25hello%25?direct'
    )
  })

  test('path with unicode', () => {
    expect(injectQuery('/usr/vite/東京', 'direct')).toEqual(
      '/usr/vite/東京?direct'
    )
  })

  test('path with unicode, space, and %', () => {
    expect(injectQuery('/usr/vite/東京 %20 hello', 'direct')).toEqual(
      '/usr/vite/東京 %20 hello?direct'
    )
  })
})

describe('isJSRequest', () => {
  test('url', () => {
    expect(isJSRequest('foo')).toBe(true)
    expect(isJSRequest('foo.js')).toBe(true)
    expect(isJSRequest('foo.x')).toBe(false)
  })

  test('url with trailing slash', () => {
    expect(isJSRequest('foo/')).toBe(false)
    expect(isJSRequest('foo/?.js')).toBe(false)
    expect(isJSRequest('foo/#.js')).toBe(false)
    expect(isJSRequest('foo/?bar=.js#.js')).toBe(false)
  })

  test('url with querystring', () => {
    expect(isJSRequest('foo.js?')).toBe(true)
    expect(isJSRequest('foo.js?bar')).toBe(true)
    expect(isJSRequest('foo.js?bar=baz')).toBe(true)
    expect(isJSRequest('foo.js?bar=baz&oops=.x')).toBe(true)
    expect(isJSRequest('foo.x?')).toBe(false)
    expect(isJSRequest('foo.x?bar')).toBe(false)
    expect(isJSRequest('foo.x?bar=baz')).toBe(false)
    expect(isJSRequest('foo.x?bar=baz&oops=.js')).toBe(false)
    expect(isJSRequest('foo.x?bar=baz&oops=.js')).toBe(false)
  })

  test('url with hash', () => {
    expect(isJSRequest('foo.js#')).toBe(true)
    expect(isJSRequest('foo.js#bar')).toBe(true)
    expect(isJSRequest('foo.js#.x')).toBe(true)
    expect(isJSRequest('foo.x#')).toBe(false)
    expect(isJSRequest('foo.x#bar')).toBe(false)
    expect(isJSRequest('foo.x#.js')).toBe(false)
  })

  test('url with querystring and hash', () => {
    expect(isJSRequest('foo.js?#')).toBe(true)
    expect(isJSRequest('foo.js?bar#')).toBe(true)
    expect(isJSRequest('foo.js?bar=baz#blub')).toBe(true)
    expect(isJSRequest('foo.js?bar=baz&oops=.x#.x')).toBe(true)
    expect(isJSRequest('foo.x?#')).toBe(false)
    expect(isJSRequest('foo.x?bar#baz')).toBe(false)
    expect(isJSRequest('foo.x?bar=baz#.js')).toBe(false)
    expect(isJSRequest('foo.x?bar=baz&oops=.js#.js')).toBe(false)
  })
})
