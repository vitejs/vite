import { expect, test } from 'vitest'
import { isBuild, page, viteTestUrl } from '~utils'

test('should load and execute the JS file', async () => {
  await page.goto(viteTestUrl + '/no-polyfills.html')
  await expect.poll(() => page.textContent('main')).toMatch('👋')
})

test.runIf(isBuild)('includes a script tag for SystemJS', async () => {
  await expect
    .poll(() => page.getAttribute('#vite-legacy-polyfill', 'src'))
    .toMatch(/.\/assets\/polyfills-legacy-(.+)\.js/)
  await expect
    .poll(() => page.getAttribute('#vite-legacy-entry', 'data-src'))
    .toMatch(/.\/assets\/index-legacy-(.+)\.js/)
})

test.runIf(isBuild)(
  'does not emit modulepreload links for legacy-only output',
  async () => {
    await page.goto(viteTestUrl + '/no-polyfills.html')
    expect(await page.content()).not.toContain('modulepreload')
  },
)
