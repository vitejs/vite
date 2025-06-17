import { expect, test } from 'vitest'
import { isBuild, page, viteTestUrl } from '~utils'

test.runIf(isBuild)('includes only a single script tag', async () => {
  await page.goto(viteTestUrl + '/no-polyfills-no-systemjs.html')

  await expect
    .poll(() => page.getAttribute('#vite-legacy-entry', 'data-src'))
    .toMatch(/.\/assets\/index-legacy-(.+)\.js/)

  expect(await page.locator('script').count()).toBe(1)
  expect(await page.locator('#vite-legacy-polyfill').count()).toBe(0)
  expect(await page.locator('#vite-legacy-entry').count()).toBe(1)
})
