import { expect, test } from 'vitest'
import { isServe, page } from '~utils'

test.runIf(isServe)('case-sensitive', async () => {
  expect(await page.textContent('h1')).toBe('')
})
