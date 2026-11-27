import { expect, test } from 'vitest'
import { isBundled, page } from '~utils'

test('from source code', async () => {
  expect(await page.textContent('.src')).toBe('bar')
})

test('from dependency', async () => {
  expect(await page.textContent('.dep')).toBe('world')
})

test.each(['dynamic', 'dynamic-assert', 'dynamic-template'])(
  'from %s import',
  async (type) => {
    await expect.poll(() => page.textContent(`.${type}`)).toBe('bar')
  },
)

test.runIf(!isBundled)(
  'preserves external dynamic import attributes',
  async () => {
    await page.click('.load-external')
    await expect.poll(() => page.textContent('.dynamic-external')).toBe('bar')
  },
)
