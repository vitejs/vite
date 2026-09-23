import { expect, test } from 'vitest'
import { getBg, isBundled, page, viteTestUrl } from '~utils'
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
