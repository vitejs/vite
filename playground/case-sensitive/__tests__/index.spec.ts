import { expect, test } from 'vitest'
import { page } from '~utils'

test('case-sensitive', async () => {
  expect(await page.textContent('h1')).toBe('')
})
