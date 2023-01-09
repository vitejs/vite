import { expect, test } from 'vitest'
import { port } from './serve'
import { getColor, page } from '~utils'

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
    'Secret Message!',
  )
})

test('msg read by fs/promises', async () => {
  await page.goto(url)
  expect(await page.textContent('.file-message')).toMatch('File Content!')
})

test('msg from primitive export', async () => {
  await page.goto(url)
  expect(await page.textContent('.primitive-export-message')).toMatch(
    'Hello World!',
  )
})

test('msg from TS transpiled exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.ts-default-export-message')).toMatch(
    'Hello World!',
  )
  expect(await page.textContent('.ts-named-export-message')).toMatch(
    'Hello World!',
  )
})

test('msg from Object.assign exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.object-assigned-exports-message')).toMatch(
    'Hello World!',
  )
})

test('msg from forwarded exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.forwarded-export-message')).toMatch(
    'Hello World!',
  )
})

test('msg from define properties exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.define-properties-exports-msg')).toMatch(
    'Hello World!',
  )
})

test('msg from define property exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.define-property-exports-msg')).toMatch(
    'Hello World!',
  )
})

test('msg from only object assigned exports', async () => {
  await page.goto(url)
  expect(await page.textContent('.only-object-assigned-exports-msg')).toMatch(
    'Hello World!',
  )
})

test('msg from no external cjs', async () => {
  await page.goto(url)
  expect(await page.textContent('.no-external-cjs-msg')).toMatch('Hello World!')
})

test('msg from optimized with nested external', async () => {
  await page.goto(url)
  expect(await page.textContent('.optimized-with-nested-external')).toMatch(
    'Hello World!',
  )
})

test('msg from optimized cjs with nested external', async () => {
  await page.goto(url)
  expect(await page.textContent('.optimized-cjs-with-nested-external')).toMatch(
    'Hello World!',
  )
})

test('msg from external using external entry', async () => {
  await page.goto(url)
  expect(await page.textContent('.external-using-external-entry')).toMatch(
    'Hello World!',
  )
})

test('msg from linked no external', async () => {
  await page.goto(url)
  expect(await page.textContent('.linked-no-external')).toMatch(
    `Hello World from ${process.env.NODE_ENV}!`,
  )
})

test('msg from linked no external', async () => {
  await page.goto(url)
  expect(await page.textContent('.dep-virtual')).toMatch('[success]')
})

test('import css library', async () => {
  await page.goto(url)
  expect(await getColor('.css-lib')).toBe('blue')
})

test('import css library', async () => {
  await page.goto(url)
  expect(await page.textContent('.module-condition')).toMatch('[success]')
})
