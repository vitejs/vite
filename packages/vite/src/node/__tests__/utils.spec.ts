import { describe, expect, test } from 'vitest'
import {
  asyncFlatten,
  getHash,
  getLocalhostAddressIfDiffersFromDNS,
  getPotentialTsSrcPaths,
  injectQuery,
  isWindows,
  resolveHostname
} from '../utils'

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

  test('path with Unicode', () => {
    expect(injectQuery('/usr/vite/東京', 'direct')).toEqual(
      '/usr/vite/東京?direct'
    )
  })

  test('path with Unicode, space, and %', () => {
    expect(injectQuery('/usr/vite/東京 %20 hello', 'direct')).toEqual(
      '/usr/vite/東京 %20 hello?direct'
    )
  })
})

describe('resolveHostname', () => {
  test('defaults to localhost', async () => {
    const resolved = await getLocalhostAddressIfDiffersFromDNS()

    expect(await resolveHostname(undefined)).toEqual({
      host: 'localhost',
      name: resolved ?? 'localhost',
      implicit: true
    })
  })

  test('accepts localhost', async () => {
    const resolved = await getLocalhostAddressIfDiffersFromDNS()

    expect(await resolveHostname('localhost')).toEqual({
      host: 'localhost',
      name: resolved ?? 'localhost',
      implicit: false
    })
  })

  test('accepts 0.0.0.0', async () => {
    expect(await resolveHostname('0.0.0.0')).toEqual({
      host: '0.0.0.0',
      name: 'localhost',
      implicit: false
    })
  })

  test('accepts ::', async () => {
    expect(await resolveHostname('::')).toEqual({
      host: '::',
      name: 'localhost',
      implicit: false
    })
  })

  test('accepts 0000:0000:0000:0000:0000:0000:0000:0000', async () => {
    expect(
      await resolveHostname('0000:0000:0000:0000:0000:0000:0000:0000')
    ).toEqual({
      host: '0000:0000:0000:0000:0000:0000:0000:0000',
      name: 'localhost',
      implicit: false
    })
  })
})

test('ts import of file with .js extension', () => {
  expect(getPotentialTsSrcPaths('test-file.js')).toEqual([
    'test-file.ts',
    'test-file.tsx'
  ])
})

test('ts import of file with .jsx extension', () => {
  expect(getPotentialTsSrcPaths('test-file.jsx')).toEqual(['test-file.tsx'])
})

test('ts import of file .mjs,.cjs extension', () => {
  expect(getPotentialTsSrcPaths('test-file.cjs')).toEqual([
    'test-file.cts',
    'test-file.ctsx'
  ])
  expect(getPotentialTsSrcPaths('test-file.mjs')).toEqual([
    'test-file.mts',
    'test-file.mtsx'
  ])
})

test('ts import of file with .js before extension', () => {
  expect(getPotentialTsSrcPaths('test-file.js.js')).toEqual([
    'test-file.js.ts',
    'test-file.js.tsx'
  ])
})

test('ts import of file with .js and query param', () => {
  expect(getPotentialTsSrcPaths('test-file.js.js?lee=123')).toEqual([
    'test-file.js.ts?lee=123',
    'test-file.js.tsx?lee=123'
  ])
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
      Promise.resolve([4, 5, 6])
    ])
    expect(arr).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('2x nested promise array', async () => {
    const arr = await asyncFlatten([
      1,
      2,
      Promise.resolve(3),
      Promise.resolve([4, 5, Promise.resolve(6), Promise.resolve([7, 8, 9])])
    ])
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
