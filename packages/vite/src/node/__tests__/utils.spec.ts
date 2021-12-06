import { injectQuery, isWindows } from '../utils'
import expect from 'expect'

if (isWindows) {
  // this test will work incorrectly on unix systems
  it('normalize windows path', () => {
    expect(injectQuery('C:\\User\\Vite\\Project', 'direct')).toEqual(
      'C:/User/Vite/Project?direct'
    )
  })
}

it('path with multiple spaces', () => {
  expect(injectQuery('/usr/vite/path with space', 'direct')).toEqual(
    '/usr/vite/path with space?direct'
  )
})

it('path with multiple % characters', () => {
  expect(injectQuery('/usr/vite/not%20a%20space', 'direct')).toEqual(
    '/usr/vite/not%20a%20space?direct'
  )
})

it('path with %25', () => {
  expect(injectQuery('/usr/vite/%25hello%25', 'direct')).toEqual(
    '/usr/vite/%25hello%25?direct'
  )
})

it('path with unicode', () => {
  expect(injectQuery('/usr/vite/東京', 'direct')).toEqual(
    '/usr/vite/東京?direct'
  )
})

it('path with unicode, space, and %', () => {
  expect(injectQuery('/usr/vite/東京 %20 hello', 'direct')).toEqual(
    '/usr/vite/東京 %20 hello?direct'
  )
})
