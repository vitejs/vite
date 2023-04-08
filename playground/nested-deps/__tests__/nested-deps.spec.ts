import { expect, test } from 'vitest'
import { page } from '~utils'

test('handle nested package', async () => {
  expect(await page.textContent('.a')).toBe('A@2.0.0')
  expect(await page.textContent('.b')).toBe('B@1.0.0')
  expect(await page.textContent('.nested-a')).toBe('A@1.0.0')
  const c = await page.textContent('.c')
  expect(c).toBe('es-C@1.0.0')
  expect(await page.textContent('.side-c')).toBe(c)
  expect(await page.textContent('.d')).toBe('D@1.0.0')
  expect(await page.textContent('.nested-d')).toBe('D-nested@1.0.0')
  // TODO: Review if the test is correct
  // expect(await page.textContent('.nested-e')).toBe('1')

  expect(await page.textContent('.absolute-f')).toBe('F@2.0.0')
})
