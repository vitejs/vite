import { port } from './serve'
import { isBuild, page } from '~utils'

const url = `http://localhost:${port}`
const mode = isBuild ? `production` : `development`

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

test('msg from no external cjs', async () => {
  await page.goto(url)
  expect(await page.textContent('.no-external-cjs-msg')).toMatch('Hello World!')
})

test('msg from optimized with nested external', async () => {
  await page.goto(url)
  expect(await page.textContent('.optimized-with-nested-external')).toMatch(
    'Hello World!'
  )
})

test('msg from optimized cjs with nested external', async () => {
  await page.goto(url)
  expect(await page.textContent('.optimized-cjs-with-nested-external')).toMatch(
    'Hello World!'
  )
})

test('msg from import-meta-env', async () => {
  await page.goto(url)
  expect(await page.textContent('.import-meta-env .base')).toBe('/')
  expect(await page.textContent('.import-meta-env .dev')).toBe(String(!isBuild))
  expect(await page.textContent('.import-meta-env .mode')).toBe(mode)
  expect(await page.textContent('.import-meta-env .prod')).toBe(String(isBuild))
  expect(await page.textContent('.import-meta-env .ssr')).toBe('true')
})

test('inline import.meta.env', async () => {
  await page.goto(url)
  expect(await page.textContent('.import-meta-env-inline .base')).toBe('/')
  expect(await page.textContent('.import-meta-env-inline .dev')).toBe(
    String(!isBuild)
  )
  expect(await page.textContent('.import-meta-env-inline .mode')).toBe(mode)
  expect(await page.textContent('.import-meta-env-inline .prod')).toBe(
    String(isBuild)
  )
  expect(await page.textContent('.import-meta-env-inline .ssr')).toBe('true')
})
