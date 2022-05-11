import { port } from './serve'
import { page } from '~utils'

const url = `http://localhost:${port}`

/**
 * test for #5809
 *
 * NOTE: This test will always succeed now, unless the temporary workaround for Jest can be removed
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 */
test('msg should be encrypted', async () => {
  await page.goto(url)
  expect(await page.textContent('.encrypted-msg')).not.toMatch(
    'Secret Message!'
  )
})

test('msg read by fs/promises', async () => {
  await page.goto(url)
  expect(await page.textContent('.file-message')).toMatch('File Content!')
})

test('msg from primitive export', async () => {
  await page.goto(url)
  expect(await page.textContent('.primitive-export-message')).toMatch(
    'Hello World!'
  )
})

test('msg from TS transpiled exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.ts-default-export-message')).toMatch(
    'Hello World!'
  )
  expect(await page.textContent('.ts-named-export-message')).toMatch(
    'Hello World!'
  )
})

test('msg from Object.assign exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.object-assigned-exports-message')).toMatch(
    'Hello World!'
  )
})

test('msg from forwarded exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.forwarded-export-message')).toMatch(
    'Hello World!'
  )
})

test('msg from define properties exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.define-properties-exports-msg')).toMatch(
    'Hello World!'
  )
})

test('msg from define property exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.define-property-exports-msg')).toMatch(
    'Hello World!'
  )
})

test('msg from only object assigned exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.only-object-assigned-exports-msg')).toMatch(
    'Hello World!'
  )
})
