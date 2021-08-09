import { isBuild, untilUpdated } from '../../testUtils'

test('should work', async () => {
  expect(await page.textContent('#app')).toMatch('Hello')
})

test('import.meta.env.LEGACY', async () => {
  expect(await page.textContent('#env')).toMatch(isBuild ? 'true' : 'false')
})

// https://github.com/vitejs/vite/issues/3400
test('transpiles down iterators correctly', async () => {
  expect(await page.textContent('#iterators')).toMatch('hello')
})

test('wraps with iife', async () => {
  expect(await page.textContent('#babel-helpers')).toMatch(
    'exposed babel helpers: false'
  )
})

test('generates assets', async () => {
  await untilUpdated(
    () => page.textContent('#assets'),
    isBuild
      ? [
          'index: 404',
          'index-legacy: 404',
          'chunk-async: 404',
          'chunk-async-legacy: 404',
          'immutable-chunk: 200',
          'immutable-chunk-legacy: 200',
          'polyfills-legacy: 404'
        ].join('\n')
      : [
          'index: 404',
          'index-legacy: 404',
          'chunk-async: 404',
          'chunk-async-legacy: 404',
          'immutable-chunk: 404',
          'immutable-chunk-legacy: 404',
          'polyfills-legacy: 404'
        ].join('\n'),
    true
  )
})
