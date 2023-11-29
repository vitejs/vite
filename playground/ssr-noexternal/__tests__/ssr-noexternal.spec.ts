import { expect, test } from 'vitest'
import { port } from './serve'
import { isBuild, page } from '~utils'

const url = `http://localhost:${port}`

test.runIf(!isBuild)('message from require-external-cjs', async () => {
  await page.goto(url)
  expect(await page.textContent('.require-external-cjs')).toMatch('foo')
})
