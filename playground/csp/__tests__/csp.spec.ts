import { expect, test } from 'vitest'
import { getColor, isBundledDev, page } from '~utils'

test.skipIf(isBundledDev)('linked css', async () => {
  expect(await getColor('.linked')).toBe('blue')
})

test('inline style tag', async () => {
  expect(await getColor('.inline')).toBe('green')
})

test.skipIf(isBundledDev)('imported css', async () => {
  expect(await getColor('.from-js')).toBe('blue')
})

test.skipIf(isBundledDev)('dynamic css', async () => {
  expect(await getColor('.dynamic')).toBe('red')
})

test.skipIf(isBundledDev)('script tag', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test.skipIf(isBundledDev)('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test('inline js', async () => {
  await expect.poll(() => page.textContent('.inline-js')).toBe('inline-js: ok')
})

test('nonce attributes are not repeated', async () => {
  const htmlSource = await page.content()
  expect(htmlSource).not.toContain(/nonce=""[^>]*nonce=""/)
  await expect
    .poll(() => page.textContent('.double-nonce-js'))
    .toBe('double-nonce-js: ok')
})

test('meta[property=csp-nonce] is injected', async () => {
  const meta = await page.$('meta[property=csp-nonce]')
  expect(await (await meta.getProperty('nonce')).jsonValue()).not.toBe('')
})
