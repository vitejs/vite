import { expect, test } from 'vitest'
import { page } from '~utils'

test('from source code', async () => {
  expect(await page.textContent('.src'), 'bar')
})

test('from dependency', async () => {
  expect(await page.textContent('.dep'), 'world')
})
