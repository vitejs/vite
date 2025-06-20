import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { fileURLToPath } from 'mlly'
import {
  asyncFlatten,
  bareImportRE,
  combineSourcemaps,
  extractHostnamesFromSubjectAltName,
  flattenId,
  generateCodeFrame,
  getHash,
  getLocalhostAddressIfDiffersFromDNS,
  getServerUrlByHost,
  injectQuery,
  isFileReadable,
  mergeWithDefaults,
  normalizePath,
  numberToPos,
  posToNumber,
  processSrcSetSync,
  resolveHostname,
} from '../utils'
import { isWindows } from '../../shared/utils'
import type { CommonServerOptions, ResolvedServerUrls } from '..'

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

describe('extractHostnamesFromSubjectAltName', () => {
  const testCases = [
    ['DNS:localhost', ['localhost']],
    ['DNS:localhost, DNS:foo.localhost', ['localhost', 'foo.localhost']],
    ['DNS:*.localhost', ['vite.localhost']],
    ['DNS:[::1]', []], // [::1] is skipped
    ['DNS:*.192.168.0.152, DNS:192.168.0.152', ['192.168.0.152']], // *.192.168.0.152 is skipped
    ['othername:"foo,bar", DNS:localhost', ['localhost']], // handle quoted correctly
  ] as const

  for (const [input, expected] of testCases) {
    test(`should extract names from subjectAltName: ${input}`, () => {
      expect(extractHostnamesFromSubjectAltName(input)).toStrictEqual(expected)
    })
  }

  test('should extract names from actual certificate', () => {
    const certText = `
-----BEGIN CERTIFICATE-----
MIID7zCCAtegAwIBAgIJS9D2rIN7tA8mMA0GCSqGSIb3DQEBCwUAMGkxFDASBgNV
BAMTC2V4YW1wbGUub3JnMQswCQYDVQQGEwJVUzERMA8GA1UECBMIVmlyZ2luaWEx
EzARBgNVBAcTCkJsYWNrc2J1cmcxDTALBgNVBAoTBFRlc3QxDTALBgNVBAsTBFRl
c3QwHhcNMjUwMTMwMDQxNTI1WhcNMjUwMzAxMDQxNTI1WjBpMRQwEgYDVQQDEwtl
eGFtcGxlLm9yZzELMAkGA1UEBhMCVVMxETAPBgNVBAgTCFZpcmdpbmlhMRMwEQYD
VQQHEwpCbGFja3NidXJnMQ0wCwYDVQQKEwRUZXN0MQ0wCwYDVQQLEwRUZXN0MIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxNPlCqTmUZ7/F7GyFWDopqZ6
w19Y7/98B10JEeFGTAQIj/RP2UgZNcTABQDUvtkF7y+bOeoVJW7Zz8ozQYhRaDp8
CN2gXMcYeTUku/pKLXyCzHHVrOPAXTeU7sMRgLvPCrrJtx5OjvndW+O/PhohPRi3
iEpPvpM8gi7MVRGhnWVSx0/Ynx5c0+/vqyBTzrM2OX7Ufg8Nv7LaTXpCAnmIQp+f
Sqq7HZ7t6Y7laS4RApityvlnFHZ4f2cEibAKv/vXLED7bgAlGb8R1viPRdMtAPuI
MYvHBgGFjyX1fmq6Mz3aqlAscJILtbQlwty1oYyaENE0lq8+nZXQ+t6I+CIVLQID
AQABo4GZMIGWMAsGA1UdDwQEAwIC9DAxBgNVHSUEKjAoBggrBgEFBQcDAQYIKwYB
BQUHAwIGCCsGAQUFBwMDBggrBgEFBQcDCDBUBgNVHREETTBLgglsb2NhbGhvc3SC
DWZvby5sb2NhbGhvc3SCECoudml0ZS5sb2NhbGhvc3SCBVs6OjFdhwR/AAABhxD+
gAAAAAAAAAAAAAAAAAABMA0GCSqGSIb3DQEBCwUAA4IBAQBi302qLCgxWsUalgc2
olFxVKob1xCciS8yUVX6HX0vza0WJ7oGW6qZsBbQtfgDwB/dHv7rwsfpjRWvFhmq
gEUrewa1h0TIC+PPTYYz4M0LOwcLIWZLZr4am1eI7YP9NDgRdhfAfM4hw20vjf2a
kYLKyRTC5+3/ly5opMq+CGLQ8/gnFxhP3ho8JYrRnqLeh3KCTGen3kmbAhD4IOJ9
lxMwFPTTWLFFjxbXjXmt5cEiL2mpcq13VCF2HmheCen37CyYIkrwK9IfLhBd5QQh
WEIBLwjKCAscrtyayXWp6zUTmgvb8PQf//3Mh2DiEngAi3WI/nL+8Y0RkqbvxBar
X2JN
-----END CERTIFICATE-----
    `.trim()
    const cert = new crypto.X509Certificate(certText)
    expect(
      extractHostnamesFromSubjectAltName(cert.subjectAltName ?? ''),
    ).toStrictEqual([
      'localhost',
      'foo.localhost',
      'vite.vite.localhost', // *.vite.localhost
    ])
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

describe('numberToPos', () => {
  test('simple', () => {
    const actual = numberToPos('a\nb', 2)
    expect(actual).toEqual({ line: 2, column: 0 })
  })
  test('pass though pos', () => {
    const actual = numberToPos('a\nb', { line: 2, column: 0 })
    expect(actual).toEqual({ line: 2, column: 0 })
  })
  test('empty line', () => {
    const actual = numberToPos('a\n\nb', 3)
    expect(actual).toEqual({ line: 3, column: 0 })
  })
  test('middle of line', () => {
    const actual = numberToPos('abc\ndef', 5)
    expect(actual).toEqual({ line: 2, column: 1 })
  })
  test('end of line', () => {
    const actual = numberToPos('abc\ndef', 3)
    expect(actual).toEqual({ line: 1, column: 3 })
  })
  test('out of range', () => {
    expect(() => numberToPos('a\nb', 5)).toThrowError(
      'offset is longer than source length',
    )
  })
})

describe('generateCodeFrames', () => {
  const source = `
import foo from './foo'
foo()
`.trim()
  const sourceCrLf = source.replaceAll('\n', '\r\n')
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

  test('start with position', () => {
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

  test('prepend base URL to srcset 2', async () => {
    const devBase = '/base/'
    expect(
      processSrcSetSync(
        './nested/asset.png 1x,./nested/asset.png 2x',
        ({ url }) => path.posix.join(devBase, url),
      ),
    ).toBe('/base/nested/asset.png 1x, /base/nested/asset.png 2x')
  })

  test('prepend base URL to srcset 3', async () => {
    const devBase = '/base/'
    expect(
      processSrcSetSync(
        '"./nested/asset.png" 1x,"./nested/asset.png" 2x',
        ({ url }) => `"${path.posix.join(devBase, url.slice(1, -1))}"`,
      ),
    ).toBe('"/base/nested/asset.png" 1x, "/base/nested/asset.png" 2x')
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

describe('combineSourcemaps', () => {
  const _dirname = path.dirname(fileURLToPath(import.meta.url))
  const resolveFile = (file: string) => {
    return normalizePath(path.resolve(_dirname, file))
  }

  test('should combine sourcemaps with single sources', () => {
    const sourcemaps = [
      // processed with magic-string
      // https://evanw.github.io/source-map-visualization/#MzQALyogY29tbWVudCAqLwpjb25zb2xlLmxvZygiZm9vIik7CjE1NgB7InZlcnNpb24iOjMsInNvdXJjZXMiOlsiL3NyYy9mb28uanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc29sZS5sb2coXCJmb29cIik7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzsifQo=
      {
        version: 3 as const,
        mappings: ';AAAA,OAAO,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC;',
        names: [],
        sources: [resolveFile('./src/foo.js')],
      },
      // processed with esbuild
      // https://evanw.github.io/source-map-visualization/#MjAAY29uc29sZS5sb2coImZvbyIpOwoxNDgAewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL3NyYy9mb28uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnNvbGUubG9nKFwiZm9vXCIpIl0sCiAgIm1hcHBpbmdzIjogIkFBQUEsUUFBUSxJQUFJLEtBQUs7IiwKICAibmFtZXMiOiBbXQp9Cg==
      {
        version: 3 as const,
        mappings: 'AAAA,QAAQ,IAAI,KAAK;',
        names: [],
        sources: [resolveFile('./src/foo.js')],
      },
    ]
    const combined = combineSourcemaps(resolveFile('./src/foo.js'), sourcemaps)
    expect(combined).toStrictEqual(
      expect.objectContaining({
        version: 3,
        file: resolveFile('./src/foo.js'),
        mappings: ';AAAA,QAAQ,IAAI,KAAK',
        sources: [resolveFile('./src/foo.js')],
      }),
    )
  })

  test('should combine sourcemaps with multiple sources', () => {
    const sourcemaps = [
      // processed with magic-string
      // https://evanw.github.io/source-map-visualization/#NzcALyogY29tbWVudCAqLwovLyBiLmpzCmNvbnNvbGUubG9nKCIuL2IuanMiKTsKCi8vIGEuanMKY29uc29sZS5sb2coIi4vYS5qcyIpOwozMzkAeyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9hLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGIuanNcbmNvbnNvbGUubG9nKFwiLi9iLmpzXCIpO1xuXG4vLyBhLmpzXG5jb25zb2xlLmxvZyhcIi4vYS5qc1wiKTtcblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7O0FBRXJCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7In0K
      {
        version: 3 as const,
        mappings:
          ';AAAA,CAAC,CAAC,CAAC,CAAC,CAAC;OACE,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC;;AAErB,CAAC,CAAC,CAAC,CAAC,CAAC;OACE,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC;;',
        names: [],
        sources: [resolveFile('./src/a.js')],
      },
      // processed with esbuild
      // https://evanw.github.io/source-map-visualization/#NjMALy8gYi5qcwpjb25zb2xlLmxvZygiLi9iLmpzIik7CgovLyBhLmpzCmNvbnNvbGUubG9nKCIuL2EuanMiKTsKMjIwAHsKICAidmVyc2lvbiI6IDMsCiAgInNvdXJjZXMiOiBbImIuanMiLCAiYS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc29sZS5sb2coJy4vYi5qcycpXG4iLCAiaW1wb3J0ICcuL2IuanMnXG5jb25zb2xlLmxvZygnLi9hLmpzJylcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxRQUFRLElBQUksUUFBUTs7O0FDQ3BCLFFBQVEsSUFBSSxRQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
      {
        version: 3 as const,
        mappings: ';AAAA,QAAQ,IAAI,QAAQ;;;ACCpB,QAAQ,IAAI,QAAQ;',
        names: [],
        sources: [resolveFile('./src/b.js'), resolveFile('./src/a.js')],
      },
    ]
    const combined = combineSourcemaps(resolveFile('./src/a.js'), sourcemaps)
    expect(combined).toStrictEqual(
      expect.objectContaining({
        version: 3,
        file: resolveFile('./src/a.js'),
        mappings: ';;OAAA,CAAQ,IAAI,QAAQ;;;OCCpB,CAAQ,IAAI,QAAQ',
        sources: [resolveFile('./src/b.js'), resolveFile('./src/a.js')],
      }),
    )
  })

  test('should combine sourcemaps with multiple sources 2', () => {
    const sourcemaps = [
      // processed with sass
      // https://evanw.github.io/source-map-visualization/#NTYALmltcG9ydGVkMiB7CiAgY29sb3I6IHJlZAp9CgouaW1wb3J0ZWQgewogIGNvbG9yOiByZWQKfQoyNzAAewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsKICAgICIvaW1wb3J0ZWQyLnNhc3MiLAogICAgIi9Gb28udnVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7RUFDRTs7O0FDRUY7RUFDRSIsCiAgImZpbGUiOiAiL0Zvby52dWUiLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICIuaW1wb3J0ZWQyXG4gIGNvbG9yOiByZWRcbiIsCiAgICAiXG5AdXNlICcuL2ltcG9ydGVkMidcblxuLmltcG9ydGVkXG4gIGNvbG9yOiByZWRcbiIKICBdCn0K
      {
        version: 3 as const,
        file: resolveFile('./src/Foo.vue'),
        mappings: 'AAAA;EACE;;;ACEF;EACE',
        names: [],
        sources: [
          resolveFile('./src/imported2.sass'),
          resolveFile('./src/Foo.vue'),
        ],
      },
      // processed with vue
      // https://evanw.github.io/source-map-visualization/#NDQACkB1c2UgJy4vaW1wb3J0ZWQyJwoKLmltcG9ydGVkCiAgY29sb3I6IHJlZAo0OTQAewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsKICAgICIvRm9vLnZ1ZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICI7QUFNQSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVqQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMiLAogICJmaWxlIjogIi9Gb28udnVlIiwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiPHRlbXBsYXRlPlxuICA8cCBjbGFzcz1cImltcG9ydGVkXCI+Zm9vPC9wPlxuICA8cCBjbGFzcz1cImltcG9ydGVkMlwiPmJhcjwvcD5cbjwvdGVtcGxhdGU+XG5cbjxzdHlsZSBsYW5nPVwic2Fzc1wiPlxuQHVzZSAnLi9pbXBvcnRlZDInXG5cbi5pbXBvcnRlZFxuICBjb2xvcjogcmVkXG48L3N0eWxlPlxuIgogIF0KfQo=
      {
        version: 3 as const,
        file: resolveFile('./src/Foo.vue'),
        sources: [resolveFile('./src/Foo.vue')],
        names: [],
        mappings:
          ';AAMA,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;;AAEjB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;EACN,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC',
      },
    ]
    const combined = combineSourcemaps(resolveFile('./src/Foo.vue'), sourcemaps)
    expect(combined).toStrictEqual(
      expect.objectContaining({
        version: 3,
        file: resolveFile('./src/Foo.vue'),
        mappings: 'AAAA;EACE;;;ACOF;EACE',
        sources: [
          resolveFile('./src/imported2.sass'),
          resolveFile('./src/Foo.vue'),
        ],
      }),
    )
  })

  test('should combine sourcemaps with multiple sources without matched source', () => {
    const sourcemaps = [
      // processed with postcss
      // https://evanw.github.io/source-map-visualization/#NjYALmZvbyB7CiAgb3ZlcmZsb3c6IHNjcm9sbDsKICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7Cn0KMjU1AHsKICAiZmlsZSI6ICIvc3JjL3Nhc3Mvc3R5bGUuc2FzcyIsCiAgIm1hcHBpbmdzIjogIkFBQUE7RUFDRSxnQkFBZ0I7RUNEbEIsa0NBQUE7QURFQSIsCiAgIm5hbWVzIjogW10sCiAgInNvdXJjZXMiOiBbCiAgICAiL3NyYy9zYXNzL3N0eWxlLnNhc3MiLAogICAgIlx1MDAwMDxubyBzb3VyY2U+IgogIF0sCiAgInNvdXJjZXNDb250ZW50IjogWyAiLmZvbyB7XG4gIG92ZXJmbG93OiBzY3JvbGw7XG59IiwgbnVsbCBdLAogICJ2ZXJzaW9uIjogMwp9Cg==
      {
        version: 3 as const,
        file: resolveFile('./src/sass/style.sass'),
        mappings: 'AAAA;EACE,gBAAgB;ECDlB,kCAAA;ADEA',
        names: [],
        sources: [
          resolveFile('./src/sass/style.sass'),
          '\x00<no source>', // postcss virtual file
        ],
      },
      // processed with sass
      // https://evanw.github.io/source-map-visualization/#MjkALmZvbyB7CiAgb3ZlcmZsb3c6IHNjcm9sbDsKfQoyMDcAewogICJmaWxlIjogIi9zcmMvc2Fzcy9zdHlsZS5zYXNzIiwKICAibWFwcGluZ3MiOiAiQUFBQTtFQUNFIiwKICAibmFtZXMiOiBbXSwKICAic291cmNlcyI6IFsKICAgICIvc3JjL3Nhc3MvdmVuZG9yL2luZGV4LnNjc3MiCiAgXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi5mb28ge1xuICBvdmVyZmxvdzogc2Nyb2xsO1xufVxuIl0sCiAgInZlcnNpb24iOiAzCn0K
      {
        version: 3 as const,
        sources: [resolveFile('./src/sass/vendor/index.scss')],
        names: [],
        mappings: 'AAAA;EACE',
      },
    ]
    const combined = combineSourcemaps(
      resolveFile('./src/sass/style.sass'),
      sourcemaps,
    )
    expect(combined).toStrictEqual(
      expect.objectContaining({
        version: 3,
        file: resolveFile('./src/sass/style.sass'),
        mappings: 'AAAA;EACE;ECDF',
        sources: [
          resolveFile('./src/sass/vendor/index.scss'),
          '\x00<no source>',
        ],
      }),
    )
  })
})

describe('getServerUrlByHost', () => {
  const urls: ResolvedServerUrls = {
    local: ['http://localhost:5173'],
    network: ['http://foo.example.com:5173'],
  }
  const cases = [
    {
      name: 'when host is undefined',
      urls,
      host: undefined,
      expected: 'http://localhost:5173',
    },
    {
      name: 'when host is true',
      urls,
      host: true,
      expected: 'http://localhost:5173',
    },
    {
      name: 'when host is explicit string',
      urls,
      host: 'foo.example.com',
      expected: 'http://foo.example.com:5173',
    },
    {
      name: 'when host is 0.0.0.0',
      urls,
      host: '0.0.0.0',
      expected: 'http://localhost:5173',
    },
    {
      name: 'when host is ::1',
      urls,
      host: '::1',
      expected: 'http://localhost:5173',
    },
  ] satisfies ReadonlyArray<{
    name: string
    urls: ResolvedServerUrls
    host: CommonServerOptions['host']
    expected: string | undefined
  }>

  for (const { name, urls, host, expected } of cases) {
    test(name, () => {
      const actual = getServerUrlByHost(urls, host)
      expect(actual).toBe(expected)
    })
  }
})
