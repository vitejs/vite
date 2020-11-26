const path = require('path')
const url = require('url')
const { createResolver } = require('../dist/node/resolver')
const {
  appendQuery,
  mapQuery,
  cleanUrl,
  parseWithQuery
} = require('../dist/node/utils')
const { osAgnosticPath } = require('../dist/node/utils')

describe('fileToRequest', () => {
  const resolver = createResolver(__dirname)
  test('handles abs paths', () => {
    const res = resolver.fileToRequest(path.resolve(__dirname, 'path/to/file'))
    expect(cleanUrl(res)).toBe('/path/to/file')
  })
  test('only has `realPath` query', () => {
    const file = path.resolve(__dirname, 'path/to/file')
    const res = resolver.fileToRequest(file)
    expect(parseWithQuery(res).query).toEqual({
      realPath: osAgnosticPath(file)
    })
  })
})

describe('resolveRelativeRequest', () => {
  const resolver = createResolver(__dirname)
  test('resolveRelativeRequest works with absolute paths', () => {
    const res = resolver.resolveRelativeRequest('/path/another', '/path/file')
    expect(res).toBe('/path/file')
  })
  test('resolveRelativeRequest works with relative paths', () => {
    const res = resolver.resolveRelativeRequest(`/path/another`, './file')
    expect(url.parse(res).pathname).toBe('/path/file')
    const res2 = resolver.resolveRelativeRequest(
      `/path/another`,
      '../path/file'
    )
    expect(url.parse(res2).pathname).toBe('/path/file')
  })
  test('resolveRelativeRequest keeps query', () => {
    const name = 'someFile.js'
    const res = resolver.resolveRelativeRequest(
      `/path/another`,
      `./${name}?type=template`
    )
    expect(decodeURIComponent(res)).toBe(
      `/path/${name}?type=template&realPath=${osAgnosticPath(
        path.resolve(__dirname, 'path', name)
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
      `/${name}?template=string&realPath=${osAgnosticPath(
        path.resolve(__dirname, name)
      )}`
    )
  })
  test('normalizePublicPath does not dupe realPath', () => {
    const name = 'someFile.js'
    const res = resolver.normalizePublicPath(`/${name}?realPath=`)
    expect(decodeURIComponent(res)).toBe(
      `/${name}?realPath=${osAgnosticPath(path.resolve(__dirname, name))}`
    )
  })
})

test('addStringQuery', () => {
  const res = appendQuery('/path', 'yyy=uao')
  expect(res).toBe('/path?yyy=uao')
  const res2 = appendQuery('/path?xxx=ciao', 'yyy=uao')
  expect(res2).toBe('/path?xxx=ciao&yyy=uao')
})

describe('mapQuery', () => {
  test('maintains query', () => {
    const res = mapQuery('/path?xxx=ciao', (q) => ({ ...q, type: 'template' }))
    expect(res).toBe('/path?xxx=ciao&type=template')
  })
  test('removes query', () => {
    const res = mapQuery('/path?xxx=ciao', (q) => ({ type: 'template' }))
    expect(res).toBe('/path?type=template')
  })
  test('does not duplicate query', () => {
    const res = mapQuery('/path?xxx=ciao', (q) => ({ xxx: 'template' }))
    expect(res).toBe('/path?xxx=template')
  })
})
