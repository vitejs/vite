import { describe, expect, test } from 'vitest'
import { port } from './serve'
import { editFile, getColor, isServe, page } from '~utils'

const url = `http://localhost:${port}`

/**
 * test for #5809
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

test('optimize-deps-nested-include', async () => {
  await page.goto(url)
  expect(await page.textContent('.optimize-deps-nested-include')).toMatch(
    'nested-include',
  )
})

describe.runIf(isServe)('hmr', () => {
  // TODO: the server file is not imported on the client at all
  // so it's not present in the client moduleGraph anymore
  // we need to decide if we want to support a usecase when ssr change
  // affects the client in any way
  test.skip('handle isomorphic module updates', async () => {
    await page.goto(url)

    expect(await page.textContent('.isomorphic-module-server')).toMatch(
      '[server]',
    )
    // Allowing additional time for this element to be filled in
    // by a client script that is loaded using dynamic import
    await expect
      .poll(async () => {
        return page.textContent('.isomorphic-module-browser')
      })
      .toMatch('[browser]')

    editFile('src/isomorphic-module-browser.js', (code) =>
      code.replace('[browser]', '[browser-hmr]'),
    )
    await page.waitForNavigation()
    await expect
      .poll(async () => {
        return page.textContent('.isomorphic-module-browser')
      })
      .toMatch('[browser-hmr]')

    editFile('src/isomorphic-module-server.js', (code) =>
      code.replace('[server]', '[server-hmr]'),
    )
    await page.waitForNavigation()
    await expect
      .poll(async () => {
        return page.textContent('.isomorphic-module-server')
      })
      .toMatch('[server-hmr]')
  })
})
