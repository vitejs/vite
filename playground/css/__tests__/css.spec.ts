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

// a plugin that reassigns `result.root` (like postcss-lightningcss or
// @tailwindcss/vite) discards the tree Vite's url rewriter walked, so the
// rewritten urls must be read back off the live root
// (https://github.com/vitejs/vite/issues/23348)
test('postcss plugin that replaces the root at OnceExit', async () => {
  await page.goto(viteTestUrl)
  const replaced = await page.waitForSelector('.replace-root')
  // the raw `./replaced-bg.png` must not survive: it is relative to the
  // source file, not to wherever the emitted stylesheet ends up. The hash
  // (bundled) and the source directory (served) are what prove it was rebased
  expect(await getBg(replaced)).toMatch(
    isBundled
      ? /\/replaced-bg-[-\w]+\.png/
      : '/replace-root-source/replaced-bg.png',
  )
})
