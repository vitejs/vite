import { getPotentialTsSrcPaths, injectQuery, isWindows } from '../utils'

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
  expect(getPotentialTsSrcPaths('test-file.cjs')).toEqual(['test-file.cts'])
  expect(getPotentialTsSrcPaths('test-file.mjs')).toEqual(['test-file.mts'])
})

test('ts import should not match .js that is not extension', () => {
  expect(getPotentialTsSrcPaths('test-file.js.mjs')).toEqual([
    'test-file.js.mts'
  ])
})
