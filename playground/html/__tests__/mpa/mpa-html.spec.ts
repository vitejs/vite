import { expect, test } from 'vitest'
import { isServe, page, viteTestUrl } from '~utils'

test.runIf(isServe)('mpa fallback', async () => {
  await page.goto(viteTestUrl + '/nested/content/')

  expect(await page.textContent('h1')).toBe('Nested')
})
