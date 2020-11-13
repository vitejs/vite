const path = require('path')
const url = require('url')
const { createResolver } = require('../../dist/node/resolver')
const { addStringQuery, mapQuery } = require('../../dist/node/utils')

test('addStringQuery', () => {
  var res = addStringQuery('/path', 'yyy=uao')
  expect(res).toBe('/path?yyy=uao')
  var res = addStringQuery('/path?xxx=ciao', 'yyy=uao')
  expect(res).toBe('/path?xxx=ciao&yyy=uao')
})

describe('mapQuery', () => {
  test('maintains query', () => {
    var res = mapQuery('/path?xxx=ciao', (q) => ({ ...q, type: 'template' }))
    expect(res).toBe('/path?xxx=ciao&type=template')
  })
  test('removes query', () => {
    var res = mapQuery('/path?xxx=ciao', (q) => ({ type: 'template' }))
    expect(res).toBe('/path?type=template')
  })
  test('does not duplicate query', () => {
    var res = mapQuery('/path?xxx=ciao', (q) => ({ xxx: 'template' }))
    expect(res).toBe('/path?xxx=template')
  })
})

describe('resolveRelativeRequest', () => {
  const resolver = createResolver(__dirname)
  test('resolveRelativeRequest wroks with absolute paths', () => {
    var res = resolver.resolveRelativeRequest('/path/another', '/path/file')
    expect(res).toBe('/path/file')
  })
  test('resolveRelativeRequest wroks with relative paths', () => {
    var res = resolver.resolveRelativeRequest(`/path/another`, './file')
    expect(url.parse(res).pathname).toBe('/path/file')
    var res = resolver.resolveRelativeRequest(`/path/another`, '../path/file')
    expect(url.parse(res).pathname).toBe('/path/file')
  })
  test('resolveRelativeRequest keeps query', () => {
    const name = 'someFile.js'
    var res = resolver.resolveRelativeRequest(
      `/path/another`,
      `./${name}?type=template`
    )
    expect(decodeURIComponent(res)).toBe(
      `/path/${name}?type=template&realPath=${path.posix.resolve(
        __dirname,
        'path',
        name
      )}`
    )
  })
})

describe('normalizePublicPath', () => {
  const resolver = createResolver(__dirname)
  test('normalizePublicPath keeps query', () => {
    const name = 'someFile.js'
    const res = resolver.normalizePublicPath(`/${name}?template=string`)
    expect(decodeURIComponent(res)).toBe(
      `/${name}?template=string&realPath=${path.posix.resolve(__dirname, name)}`
    )
  })
  test('normalizePublicPath does not dupe realPath', () => {
    const name = 'someFile.js'
    const res = resolver.normalizePublicPath(`/${name}?realPath=`)
    expect(decodeURIComponent(res)).toBe(
      `/${name}?realPath=${path.posix.resolve(__dirname, name)}`
    )
  })
})
