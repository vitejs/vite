import { expect, test } from 'vitest'
import { page } from '~utils'

test('resolve.mainFields.custom-first', async () => {
  expect(await page.textContent('.custom-browser-main-field')).toBe(
    'resolved custom field',
  )
})
