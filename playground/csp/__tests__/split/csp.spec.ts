import { expect, test } from 'vitest'
import {
  expectNoncesToBe,
  fetchRawHtml,
  APP_SCRIPT_SELECTOR,
  getNonce,
  repeatedNonceRE,
} from '../utils'
import { getColor, isBuild, isServe, page } from '~utils'

// The served CSP is `script-src 'nonce-S'; style-src 'nonce-T'` with S !== T, so
// anything that ends up with the wrong nonce is blocked by the browser. These two
// smoke tests are what catch that — the nonce assertions below read attributes and
// would still pass on a blocked page.
test('styles apply under a split CSP', async () => {
  expect(await getColor('.linked')).toBe('blue')
  expect(await getColor('.inline')).toBe('green')
  expect(await getColor('.from-js')).toBe('blue')
  expect(await getColor('.dynamic')).toBe('red')
})

test('scripts run under a split CSP', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
  await expect.poll(() => page.textContent('.inline-js')).toBe('inline-js: ok')
})

test('only the split meta tags are injected', async () => {
  expect((await page.$$('meta[property="csp-nonce"]')).length).toBe(0)
  expect((await page.$$('meta[property="csp-script-nonce"]')).length).toBe(1)
  expect((await page.$$('meta[property="csp-style-nonce"]')).length).toBe(1)

  const scriptNonce = await getNonce('meta[property="csp-script-nonce"]')
  const styleNonce = await getNonce('meta[property="csp-style-nonce"]')
  expect(scriptNonce).toBeTruthy()
  expect(styleNonce).toBeTruthy()
  expect(scriptNonce).not.toBe(styleNonce)
})

test('nonce attributes are not repeated', async () => {
  expect(await fetchRawHtml()).not.toMatch(repeatedNonceRE)
  await expect
    .poll(() => page.textContent('.double-nonce-js'))
    .toBe('double-nonce-js: ok')
})

test('static tags get the nonce of their destination', async () => {
  const scriptNonce = await getNonce('meta[property="csp-script-nonce"]')
  const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

  expect(await getNonce('link[rel="stylesheet"]')).toBe(styleNonce)
  expect(await getNonce('style')).toBe(styleNonce)
  expect(await getNonce(APP_SCRIPT_SELECTOR)).toBe(scriptNonce)
})

test.runIf(isServe)('dev-injected style tags get the style nonce', async () => {
  const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

  await expectNoncesToBe('style[data-vite-dev-id]', styleNonce)
})

test.runIf(isBuild)(
  'tags appended by __vitePreload get the nonce of their destination',
  async () => {
    const scriptNonce = await getNonce('meta[property="csp-script-nonce"]')
    const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

    await expectNoncesToBe(
      'link[rel="modulepreload"], link[rel="preload"][as="script"]',
      scriptNonce,
    )
    await expectNoncesToBe('link[rel="stylesheet"]', styleNonce)
  },
)
