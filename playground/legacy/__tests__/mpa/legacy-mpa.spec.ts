import { expect, test } from 'vitest'
import { isBuild, page, viteTestUrl } from '~utils'

test.runIf(isBuild)('includes a script tag for Mpa', async () => {
  await page.goto(viteTestUrl + '/mpa/only-element.html')

  expect(await page.locator('script').count()).toBe(0)
  expect(await page.locator('#vite-legacy-polyfill').count()).toBe(0)
})
