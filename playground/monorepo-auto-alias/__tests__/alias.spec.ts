import { expect, test } from 'vitest'
import { page } from '~utils'

test('default import', async () => {
  expect(await page.textContent('#default')).toMatch('index.ts')
})

test('deep import', async () => {
  expect(await page.textContent('#deep')).toMatch('dir/deep.ts')
})
