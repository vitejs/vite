import { expect, test } from 'vitest'
import { expectWithRetry, getColor, page } from '~utils'

test('linked css', async () => {
  expect(await getColor('.linked')).toBe('blue')
})

test('inline style tag', async () => {
  expect(await getColor('.inline')).toBe('green')
})

test('script tag', async () => {
  await expectWithRetry(() => page.textContent('.js')).toBe('js: ok')
})
