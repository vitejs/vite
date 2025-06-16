import { expect, test } from 'vitest'
import { getColor, page } from '~utils'

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
