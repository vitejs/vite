import { expect, test } from 'vitest'
import { getColor, isBuild, page, viteTestUrl } from '~utils'

test('should load and execute the JS file', async () => {
  await page.goto(viteTestUrl + '/no-polyfills.html')
  await expect.poll(() => page.textContent('main')).toMatch('👋')
})

test('preserves stylesheets with modulepreload text in an attribute', async () => {
  await page.goto(viteTestUrl + '/no-polyfills.html')
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(1)
  expect(await page.getAttribute('link[rel="stylesheet"]', 'title')).toBe(
    'Example: rel="modulepreload"',
  )
  expect(await getColor('main')).toBe('blue')
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
    expect(await page.locator('link[rel~="modulepreload"]').count()).toBe(0)
  },
)
