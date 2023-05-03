import { beforeEach, expect, test } from 'vitest'
import { port } from './serve'
import { page } from '~utils'

const url = `http://localhost:${port}`

beforeEach(async () => {
  await page.goto(url)
})

test('load json module', async () => {
  expect(await page.textContent('.fetch-json-module pre')).toBe(
    'export default JSON.parse("{\\n  \\"hello\\": \\"hi\\"\\n}\\n")',
  )
})

test('fs json', async () => {
  expect(await page.textContent('.fetch-json-fs pre')).toBe('61')
})
