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

// a plugin that reassigns `result.root` at OnceExit (like postcss-lightningcss
// does) instead of mutating the existing root in place
test('postcss plugin that reassigns result.root at OnceExit', async () => {
  await page.goto(viteTestUrl)
  const imported = await page.waitForSelector('.replace-root-once-exit')
  expect(await getBg(imported)).toMatch(
    isBundled ? /base64/ : '/injected-source/injected-bg.png',
  )
})
