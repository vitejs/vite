import { expect, test } from 'vitest'
import { tests } from './tests'
import { page } from '~utils'

test('module type should be supported', async () => {
  expect(await page.textContent('#module-type-json-pre')).toBe('json')
  expect(await page.textContent('#module-type-json-post')).toBe('js')
  expect(await page.textContent('#module-type-json-virtual-pre')).toBe('json')
  expect(await page.textContent('#module-type-json-virtual-post')).toBe('js')
})

test('lazy hook filter should be applied', async () => {
  expect(await page.textContent('#lazy-hook-filter')).toBe('success')
})

tests()
