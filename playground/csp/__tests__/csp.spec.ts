import { expect, test } from 'vitest'
import {
  expectNoncesToBe,
  fetchRawHtml,
  APP_SCRIPT_SELECTOR,
  getNonce,
  repeatedNonceRE,
} from './utils'
import { getColor, isBuild, isServe, page } from '~utils'

test('linked css', async () => {
  expect(await getColor('.linked')).toBe('blue')
})

test('inline style tag', async () => {
  expect(await getColor('.inline')).toBe('green')
})

test('imported css', async () => {
  expect(await getColor('.from-js')).toBe('blue')
})

test('dynamic css', async () => {
  expect(await getColor('.dynamic')).toBe('red')
})

test('script tag', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test('inline js', async () => {
  await expect.poll(() => page.textContent('.inline-js')).toBe('inline-js: ok')
})

test('nonce attributes are not repeated', async () => {
  expect(await fetchRawHtml()).not.toMatch(repeatedNonceRE)
  await expect
    .poll(() => page.textContent('.double-nonce-js'))
    .toBe('double-nonce-js: ok')
})

test('only the shared meta tag is injected', async () => {
  expect((await page.$$('meta[property="csp-nonce"]')).length).toBe(1)
  expect((await page.$$('meta[property="csp-script-nonce"]')).length).toBe(0)
  expect((await page.$$('meta[property="csp-style-nonce"]')).length).toBe(0)

  // `getNonce` returns null for a missing element, so assert on the value too
  const sharedNonce = await getNonce('meta[property="csp-nonce"]')
  expect(sharedNonce).toBeTruthy()
})

test('static tags all get the shared nonce', async () => {
  const sharedNonce = await getNonce('meta[property="csp-nonce"]')

  expect(await getNonce('link[rel="stylesheet"]')).toBe(sharedNonce)
  expect(await getNonce('style')).toBe(sharedNonce)
  expect(await getNonce(APP_SCRIPT_SELECTOR)).toBe(sharedNonce)
})

test.runIf(isServe)(
  'dev-injected style tags get the shared nonce',
  async () => {
    const sharedNonce = await getNonce('meta[property="csp-nonce"]')

    await expectNoncesToBe('style[data-vite-dev-id]', sharedNonce)
  },
)

test.runIf(isBuild)(
  'tags appended by __vitePreload get the shared nonce',
  async () => {
    const sharedNonce = await getNonce('meta[property="csp-nonce"]')

    await expectNoncesToBe(
      'link[rel="modulepreload"], link[rel="preload"][as="script"]',
      sharedNonce,
    )
    await expectNoncesToBe('link[rel="stylesheet"]', sharedNonce)
  },
)
