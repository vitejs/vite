import { isBuild } from '../../testUtils'

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
