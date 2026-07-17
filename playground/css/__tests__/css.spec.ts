import { test, expect } from 'vitest'
import { page, viteTestUrl } from '~utils'
import './tests'

test('css module hash consistency across queries', async () => {
  await page.goto(viteTestUrl)
  const result = JSON.parse(
    await page.textContent('.css-module-hash-consistency'),
  )
  expect(result.normal).toBeTruthy()
  expect(result.normal).toBe(result.inline)
})
