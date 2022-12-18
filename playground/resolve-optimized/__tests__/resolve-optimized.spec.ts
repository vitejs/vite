import { expect, test } from 'vitest'
import { page } from '~utils'

test('resolve-optimized', async () => {
  expect(await page.textContent('.a')).toBe('package-a-module')
  expect(await page.textContent('.b')).toBe(
    'package-b-module:package-a-module:package-custom-main-field:package-custom-condition',
  )
  expect(await page.textContent('.custom-main-field')).toBe(
    'package-custom-main-field',
  )
  expect(await page.textContent('.custom-condition')).toBe(
    'package-custom-condition',
  )

  expect(await page.textContent('.a-count')).toBe('success')
  expect(await page.textContent('.custom-main-field-count')).toBe('success')
  expect(await page.textContent('.custom-condition-count')).toBe('success')
})
