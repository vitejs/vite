import { expect, test } from 'vitest'
import { page } from '~utils'

test('resolve-optimized-dup-deps', async () => {
  expect(await page.textContent('.a')).toBe('test-package-a:test-package-b-v2')
  expect(await page.textContent('.b')).toBe('test-package-b-v1')
})
