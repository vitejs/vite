import { expect, test } from 'vitest'
import { expectWithRetry, getColor, page } from '~utils'

test('linked css', async () => {
  expect(await getColor('.linked')).toBe('blue')
})

test('inline style tag', async () => {
  expect(await getColor('.inline')).toBe('green')
})

test('imported css', async () => {
  expect(await getColor('.from-js')).toBe('blue')
})

test('script tag', async () => {
  await expectWithRetry(() => page.textContent('.js')).toBe('js: ok')
})

test('meta[property=csp-nonce] is injected', async () => {
  const meta = await page.$('meta[property=csp-nonce]')
  expect(await (await meta.getProperty('nonce')).jsonValue()).not.toBe('')
})
