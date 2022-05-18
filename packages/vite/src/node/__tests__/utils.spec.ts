import { describe, expect, test } from 'vitest'
import {
  getHash,
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
  test('defaults to 127.0.0.1', () => {
    expect(resolveHostname(undefined)).toEqual({
      host: '127.0.0.1',
      name: 'localhost'
    })
  })

  test('accepts localhost', () => {
    expect(resolveHostname('localhost')).toEqual({
      host: 'localhost',
      name: 'localhost'
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
