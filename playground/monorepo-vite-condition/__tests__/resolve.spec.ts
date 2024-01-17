import { expect, test } from 'vitest'
import { page } from '~utils'

test('main - default import', async () => {
  expect(await page.textContent('#main-default')).toMatch('main.ts')
})

test('exports - default import', async () => {
  expect(await page.textContent('#exports-default')).toMatch('index.ts')
})

test('exports - deep import', async () => {
  expect(await page.textContent('#exports-deep')).toMatch('dir/deep.tsx')
})
