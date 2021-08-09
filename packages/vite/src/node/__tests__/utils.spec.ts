import { injectQuery, isWindows, toAssetPublicPath } from '../utils'

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

describe('asset public path', () => {
  const that = (file: string, dir: string, base: string) =>
    toAssetPublicPath(file, dir, { base })

  test('/', () => expect(that('assets/foo.js', '', '/')).toBe('/assets/foo.js'))

  test('(empty)', () =>
    expect(that('assets/foo.js', '', '')).toBe('assets/foo.js'))

  test('https://a.com/', () =>
    expect(that('assets/foo.js', '', 'https://a.com/')).toBe(
      'https://a.com/assets/foo.js'
    ))

  test('nested /', () =>
    expect(that('assets/foo.js', 'nested', '/')).toBe('/assets/foo.js'))

  test('nested ./', () =>
    expect(that('assets/foo.js', 'nested', './')).toBe('../assets/foo.js'))

  test('relatively nested ./', () =>
    expect(that('relatively/bar.js', 'relatively/nested', './')).toBe(
      '../bar.js'
    ))
})
