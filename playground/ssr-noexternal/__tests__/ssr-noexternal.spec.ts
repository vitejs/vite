import { expect, test } from 'vitest'
import { port } from './serve'
import { page } from '~utils'

const url = `http://localhost:${port}`

test('message from require-external-cjs', async () => {
  await page.goto(url)
  expect(await page.textContent('.require-external-cjs')).toMatch('foo')
})
