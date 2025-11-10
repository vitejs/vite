import { expect, test } from 'vitest'
import { port } from './serve'
import { page } from '~utils'

const url = `http://localhost:${port}`

test('should work when inlined', async () => {
  await page.goto(`${url}/static-light`)
  expect(await page.textContent('.static-light')).toMatch('42')
})

test('should work when output', async () => {
  await page.goto(`${url}/static-heavy`)
  expect(await page.textContent('.static-heavy')).toMatch('24')
})
