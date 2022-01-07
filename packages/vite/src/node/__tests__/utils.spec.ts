import { asyncPool, injectQuery, isWindows } from '../utils'

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

test('asyncPool', async () => {
  const finished: number[] = []
  await asyncPool({
    concurrency: 3,
    items: [1, 6, 4, 2, 5, 3],
    fn: (nb) =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          finished.push(nb)
          resolve()
        }, nb * 10)
      )
  })
  expect(finished).toEqual([1, 2, 4, 6, 3, 5])
})
