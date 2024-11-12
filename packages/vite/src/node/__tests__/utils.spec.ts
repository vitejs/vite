import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  asyncFlatten,
  bareImportRE,
  flattenId,
  generateCodeFrame,
  getHash,
  getLocalhostAddressIfDiffersFromDNS,
  injectQuery,
  isFileReadable,
  mergeWithDefaults,
  posToNumber,
  processSrcSetSync,
  resolveHostname,
} from '../utils'
import { isWindows } from '../../shared/utils'

describe('bareImportRE', () => {
  test('should work with normal package name', () => {
    expect(bareImportRE.test('vite')).toBe(true)
  })
  test('should work with scoped package name', () => {
    expect(bareImportRE.test('@vitejs/plugin-vue')).toBe(true)
  })

  test('should work with absolute paths', () => {
    expect(bareImportRE.test('/foo')).toBe(false)
    expect(bareImportRE.test('C:/foo')).toBe(false)
    expect(bareImportRE.test('C:\\foo')).toBe(false)
  })
  test('should work with relative path', () => {
    expect(bareImportRE.test('./foo')).toBe(false)
    expect(bareImportRE.test('.\\foo')).toBe(false)
  })
})

describe('injectQuery', () => {
  if (isWindows) {
    // this test will work incorrectly on unix systems
    test('normalize windows path', () => {
      expect(injectQuery('C:\\User\\Vite\\Project', 'direct')).toEqual(
        'C:/User/Vite/Project?direct',
      )
    })

    test('absolute file path', () => {
      expect(injectQuery('C:\\test-file.vue', 'direct')).toEqual(
        'C:/test-file.vue?direct',
      )
    })

    test('absolute file path with parameters', () => {
      expect(
        injectQuery('C:\\test-file.vue?vue&type=template&lang.js', 'direct'),
      ).toEqual('C:/test-file.vue?direct&vue&type=template&lang.js')
    })
  }

  test('relative path', () => {
    expect(injectQuery('usr/vite/%20a%20', 'direct')).toEqual(
      'usr/vite/%20a%20?direct',
    )
    expect(injectQuery('./usr/vite/%20a%20', 'direct')).toEqual(
      './usr/vite/%20a%20?direct',
    )
    expect(injectQuery('../usr/vite/%20a%20', 'direct')).toEqual(
      '../usr/vite/%20a%20?direct',
    )
  })

  test('path with hash', () => {
    expect(injectQuery('/usr/vite/path with space/#1?2/', 'direct')).toEqual(
      '/usr/vite/path with space/?direct#1?2/',
    )
  })

  test('path with protocol', () => {
    expect(injectQuery('file:///usr/vite/%20a%20', 'direct')).toMatch(
      'file:///usr/vite/%20a%20?direct',
    )
    expect(injectQuery('http://usr.vite/%20a%20', 'direct')).toMatch(
      'http://usr.vite/%20a%20?direct',
    )
  })

  test('path with multiple spaces', () => {
    expect(injectQuery('/usr/vite/path with space', 'direct')).toEqual(
      '/usr/vite/path with space?direct',
    )
  })

  test('path with multiple % characters', () => {
    expect(injectQuery('/usr/vite/not%20a%20space', 'direct')).toEqual(
      '/usr/vite/not%20a%20space?direct',
    )
  })

  test('path with %25', () => {
    expect(injectQuery('/usr/vite/%25hello%25', 'direct')).toEqual(
      '/usr/vite/%25hello%25?direct',
    )
  })

  test('path with Unicode', () => {
    expect(injectQuery('/usr/vite/東京', 'direct')).toEqual(
      '/usr/vite/東京?direct',
    )
  })

  test('path with Unicode, space, and %', () => {
    expect(injectQuery('/usr/vite/東京 %20 hello', 'direct')).toEqual(
      '/usr/vite/東京 %20 hello?direct',
    )
  })

  test('path with url-encoded path as query parameter', () => {
    const src = '/src/module.ts?url=https%3A%2F%2Fusr.vite%2F'
    const expected = '/src/module.ts?t=1234&url=https%3A%2F%2Fusr.vite%2F'
    expect(injectQuery(src, 't=1234')).toEqual(expected)
  })
})

describe('resolveHostname', () => {
  test('defaults to localhost', async () => {
    const resolved = await getLocalhostAddressIfDiffersFromDNS()

    expect(await resolveHostname(undefined)).toEqual({
      host: 'localhost',
      name: resolved ?? 'localhost',
    })
  })

  test('accepts localhost', async () => {
    const resolved = await getLocalhostAddressIfDiffersFromDNS()

    expect(await resolveHostname('localhost')).toEqual({
      host: 'localhost',
      name: resolved ?? 'localhost',
    })
  })

  test('accepts 0.0.0.0', async () => {
    expect(await resolveHostname('0.0.0.0')).toEqual({
      host: '0.0.0.0',
      name: 'localhost',
    })
  })

  test('accepts ::', async () => {
    expect(await resolveHostname('::')).toEqual({
      host: '::',
      name: 'localhost',
    })
  })

  test('accepts 0000:0000:0000:0000:0000:0000:0000:0000', async () => {
    expect(
      await resolveHostname('0000:0000:0000:0000:0000:0000:0000:0000'),
    ).toEqual({
      host: '0000:0000:0000:0000:0000:0000:0000:0000',
      name: 'localhost',
    })
  })
})

describe('posToNumber', () => {
  test('simple', () => {
    const actual = posToNumber('a\nb', { line: 2, column: 0 })
    expect(actual).toBe(2)
  })
  test('pass though pos', () => {
    const actual = posToNumber('a\nb', 2)
    expect(actual).toBe(2)
  })
  test('empty line', () => {
    const actual = posToNumber('a\n\nb', { line: 3, column: 0 })
    expect(actual).toBe(3)
  })
  test('out of range', () => {
    const actual = posToNumber('a\nb', { line: 4, column: 0 })
    expect(actual).toBe(4)
  })
})

describe('generateCodeFrames', () => {
  const source = `
import foo from './foo'
foo()
`.trim()
  const sourceCrLf = source.replace(/\n/, '\r\n')
  const longSource = `
import foo from './foo'

foo()
// 1
// 2
// 3
`.trim()

  const expectSnapshot = (value: string) => {
    try {
      // add new line to make snapshot easier to read
      expect('\n' + value + '\n').toMatchSnapshot()
    } catch (e) {
      // don't include this function in stacktrace
      Error.captureStackTrace(e, expectSnapshot)
      throw e
    }
  }

  test('start with number', () => {
    expectSnapshot(generateCodeFrame(source, -1))
    expectSnapshot(generateCodeFrame(source, 0))
    expectSnapshot(generateCodeFrame(source, 1))
    expectSnapshot(generateCodeFrame(source, 24))
  })

  test('start with postion', () => {
    expectSnapshot(generateCodeFrame(source, { line: 1, column: 0 }))
    expectSnapshot(generateCodeFrame(source, { line: 1, column: 1 }))
    expectSnapshot(generateCodeFrame(source, { line: 2, column: 0 }))
  })

  test('works with CRLF', () => {
    expectSnapshot(generateCodeFrame(sourceCrLf, { line: 2, column: 0 }))
  })

  test('end', () => {
    expectSnapshot(generateCodeFrame(source, 0, 0))
    expectSnapshot(generateCodeFrame(source, 0, 23))
    expectSnapshot(generateCodeFrame(source, 0, 29))
    expectSnapshot(generateCodeFrame(source, 0, source.length))
    expectSnapshot(generateCodeFrame(source, 0, source.length + 1))
    expectSnapshot(generateCodeFrame(source, 0, source.length + 100))
  })

  test('range', () => {
    expectSnapshot(generateCodeFrame(longSource, { line: 3, column: 0 }))
    expectSnapshot(
      generateCodeFrame(
        longSource,
        { line: 3, column: 0 },
        { line: 4, column: 0 },
      ),
    )
  })

  test('invalid start > end', () => {
    expectSnapshot(generateCodeFrame(source, 2, 0))
  })
})

describe('getHash', () => {
  test('8-digit hex', () => {
    const hash = getHash(Buffer.alloc(0))
    expect(hash).toMatch(/^[\da-f]{8}$/)
  })
})

describe('asyncFlatten', () => {
  test('plain array', async () => {
    const arr = await asyncFlatten([1, 2, 3])
    expect(arr).toEqual([1, 2, 3])
  })

  test('nested array', async () => {
    const arr = await asyncFlatten([1, 2, 3, [4, 5, 6]])
    expect(arr).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('nested falsy array', async () => {
    const arr = await asyncFlatten([1, 2, false, [4, null, undefined]])
    expect(arr).toEqual([1, 2, false, 4, null, undefined])
  })

  test('plain promise array', async () => {
    const arr = await asyncFlatten([1, 2, Promise.resolve(3)])
    expect(arr).toEqual([1, 2, 3])
  })

  test('nested promise array', async () => {
    const arr = await asyncFlatten([
      1,
      2,
      Promise.resolve(3),
      Promise.resolve([4, 5, 6]),
    ])
    expect(arr).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('2x nested promise array', async () => {
    const arr = await asyncFlatten([
      1,
      2,
      Promise.resolve(3),
      Promise.resolve([4, 5, Promise.resolve(6), Promise.resolve([7, 8, 9])]),
    ])
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('isFileReadable', () => {
  test("file doesn't exist", async () => {
    expect(isFileReadable('/does_not_exist')).toBe(false)
  })

  const testFile = require.resolve(
    './utils/isFileReadable/permission-test-file',
  )
  test('file with normal permission', async () => {
    expect(isFileReadable(testFile)).toBe(true)
  })

  if (process.platform !== 'win32') {
    test('file with read-only permission', async () => {
      fs.chmodSync(testFile, '400')
      expect(isFileReadable(testFile)).toBe(true)
    })
    test.runIf(process.getuid && process.getuid() !== 0)(
      'file without read permission',
      async () => {
        fs.chmodSync(testFile, '044')
        expect(isFileReadable(testFile)).toBe(false)
        fs.chmodSync(testFile, '644')
      },
    )
  }
})

describe('processSrcSetSync', () => {
  test('prepend base URL to srcset', async () => {
    const devBase = '/base/'
    expect(
      processSrcSetSync(
        './nested/asset.png 1x, ./nested/asset.png 2x',
        ({ url }) => path.posix.join(devBase, url),
      ),
    ).toBe('/base/nested/asset.png 1x, /base/nested/asset.png 2x')
  })

  test('should not split the comma inside base64 value', async () => {
    const base64 =
      'data:image/avif;base64,aA+/0= 400w, data:image/avif;base64,bB+/9= 800w'
    expect(processSrcSetSync(base64, ({ url }) => url)).toBe(base64)
  })

  test('should not split the comma inside image URI', async () => {
    const imageURIWithComma =
      'asset.png?param1=true,param2=false 400w, asset.png?param1=true,param2=false 800w'
    expect(processSrcSetSync(imageURIWithComma, ({ url }) => url)).toBe(
      imageURIWithComma,
    )
  })

  test('should handle srcset when descriptor is not present', async () => {
    const srcsetNoDescriptor = 'asset.png, test.png 400w'
    const result = 'asset.png, test.png 400w'
    expect(processSrcSetSync(srcsetNoDescriptor, ({ url }) => url)).toBe(result)
  })

  test('should not break a regular URL in srcSet', async () => {
    const source = 'https://anydomain/image.jpg'
    expect(
      processSrcSetSync('https://anydomain/image.jpg', ({ url }) => url),
    ).toBe(source)
  })

  test('should not break URLs with commas in srcSet', async () => {
    const source = `
      \thttps://example.com/dpr_1,f_auto,fl_progressive,q_auto,w_100/v1/img   1x,
      \thttps://example.com/dpr_2,f_auto,fl_progressive,q_auto,w_100/v1/img\t\t2x
    `
    const result =
      'https://example.com/dpr_1,f_auto,fl_progressive,q_auto,w_100/v1/img 1x, https://example.com/dpr_2,f_auto,fl_progressive,q_auto,w_100/v1/img 2x'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should not break URLs with commas in image-set-options', async () => {
    const source = `url(https://example.com/dpr_1,f_auto,fl_progressive,q_auto,w_100/v1/img)   1x,
      url("https://example.com/dpr_2,f_auto,fl_progressive,q_auto,w_100/v1/img")\t\t2x
    `
    const result =
      'url(https://example.com/dpr_1,f_auto,fl_progressive,q_auto,w_100/v1/img) 1x, url("https://example.com/dpr_2,f_auto,fl_progressive,q_auto,w_100/v1/img") 2x'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should parse image-set-options with resolution', async () => {
    const source = ` "foo.png" 1x,
                     "foo-2x.png" 2x,
                     "foo-print.png" 600dpi`
    const result = '"foo.png" 1x, "foo-2x.png" 2x, "foo-print.png" 600dpi'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should parse image-set-options with type', async () => {
    const source = ` "foo.avif" type("image/avif"),
                     "foo.jpg" type("image/jpeg") `
    const result = '"foo.avif" type("image/avif"), "foo.jpg" type("image/jpeg")'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should parse image-set-options with linear-gradient', async () => {
    const source = `linear-gradient(cornflowerblue, white) 1x,
                    url("detailed-gradient.png") 3x`
    const result =
      'linear-gradient(cornflowerblue, white) 1x, url("detailed-gradient.png") 3x'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should parse image-set-options with resolution and type specified', async () => {
    const source = `url("picture.png")\t1x\t type("image/jpeg"), url("picture.png")\t type("image/jpeg")\t2x`
    const result =
      'url("picture.png") 1x type("image/jpeg"), url("picture.png") type("image/jpeg") 2x'
    expect(processSrcSetSync(source, ({ url }) => url)).toBe(result)
  })

  test('should capture whole image set options', async () => {
    const source = `linear-gradient(cornflowerblue, white) 1x,
                    url("detailed-gradient.png") 3x`
    const expected = [
      'linear-gradient(cornflowerblue, white)',
      'url("detailed-gradient.png")',
    ]
    const result: string[] = []
    processSrcSetSync(source, ({ url }) => {
      result.push(url)
      return url
    })
    expect(result).toEqual(expected)
  })
})

describe('flattenId', () => {
  test('should limit id to 170 characters', () => {
    const tenChars = '1234567890'
    let id = ''

    for (let i = 0; i < 17; i++) {
      id += tenChars
    }
    expect(id).toHaveLength(170)

    const result = flattenId(id)
    expect(result).toHaveLength(170)

    id += tenChars
    const result2 = flattenId(id)
    expect(result2).toHaveLength(170)
  })
})

describe('mergeWithDefaults', () => {
  test('merges with defaults', () => {
    const actual = mergeWithDefaults(
      {
        useDefault: 1,
        useValueIfNull: 2,
        replaceArray: [0, 1],
        nested: {
          foo: 'bar',
        },
      },
      {
        useDefault: undefined,
        useValueIfNull: null,
        useValueIfNoDefault: 'foo',
        replaceArray: [2, 3],
        nested: {
          foo2: 'bar2',
        },
      },
    )
    expect(actual).toStrictEqual({
      useDefault: 1,
      useValueIfNull: null,
      useValueIfNoDefault: 'foo',
      replaceArray: [2, 3],
      nested: {
        foo: 'bar',
        foo2: 'bar2',
      },
    })

    const defaults = {
      object: {},
      array: [],
      regex: /foo/,
      function: () => {},
    }
    const actual2 = mergeWithDefaults(defaults, {})
    expect(actual2.object).toStrictEqual({})
    expect(actual2.array).toStrictEqual([])
    expect(actual2.regex).toStrictEqual(/foo/)
    expect(actual2.function).toStrictEqual(expect.any(Function))
    // cloned
    expect(actual2.object).not.toBe(defaults.object)
    expect(actual2.array).not.toBe(defaults.array)
  })
})
