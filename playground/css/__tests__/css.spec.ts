import { expect, test } from 'vitest'
import {
  findAssetFile,
  getBg,
  isBuild,
  isBundled,
  page,
  viteTestUrl,
} from '~utils'
import './tests'

// not included in tests.ts because the lightningcss variant does not use
// the postcss pipeline
test('postcss plugin that injects url() at OnceExit', async () => {
  await page.goto(viteTestUrl)
  const imported = await page.waitForSelector('.inject-url-once-exit')
  // url should be rebased against the injected source file
  expect(await getBg(imported)).toMatch(
    isBundled ? /base64/ : '/injected-source/injected-bg.png',
  )
})

test.runIf(isBuild)('preserves explicit cascade-layer ordering', () => {
  const css = findAssetFile(/index-[-\w]+\.css$/)
  expect(css).toContain('@layer vite-layer-order-reset,vite-layer-order-main;')
})
