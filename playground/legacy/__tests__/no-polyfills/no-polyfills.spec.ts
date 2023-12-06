import { test } from 'vitest'
import { isBuild, page, untilUpdated, viteTestUrl } from '~utils'

test('should load and execute the JS file', async () => {
  await page.goto(viteTestUrl + '/no-polyfills.html')
  await untilUpdated(() => page.textContent('main'), '👋', true)
})

test.runIf(isBuild)('includes a script tag for SystemJS', async () => {
  await untilUpdated(
    () => page.getAttribute('#vite-legacy-polyfill', 'src'),
    /.\/assets\/polyfills-legacy-(.+)\.js/,
    true,
  )
  await untilUpdated(
    () => page.getAttribute('#vite-legacy-entry', 'data-src'),
    /.\/assets\/index-legacy-(.+)\.js/,
    true,
  )
})
