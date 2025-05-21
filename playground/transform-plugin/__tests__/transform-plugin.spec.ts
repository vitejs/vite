import { expect, test } from 'vitest'
import { tests } from './tests'
import { page } from '~utils'

test('module type should be supported', async () => {
  expect(await page.textContent('#module-type-json-pre')).toBe('json')
  expect(await page.textContent('#module-type-json-post')).toBe('js')
})

tests()
