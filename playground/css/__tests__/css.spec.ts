import { expect, test } from 'vitest'
import {
  editFile,
  getBg,
  getColor,
  isBuild,
  isBundled,
  page,
  viteTestUrl,
} from '~utils'
import { tests } from './tests'

tests()

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

test('composed CSS module asset URLs', async () => {
  await page.goto(`${viteTestUrl}/composed/`)
  const imported = await page.waitForSelector('.composed[class*="entry"]')
  const background = await getBg(imported)
  const mask = await imported.evaluate((el) => getComputedStyle(el).maskImage)

  expect(background).toMatch(
    isBundled ? /assets\/image-[\w-]+\.svg/ : '/composed/shared/image.svg',
  )
  expect(mask).toMatch(
    isBundled ? /assets\/image-[\w-]+\.svg/ : '/composed/nested/image.svg',
  )
  expect(await getColor(imported)).toBe('purple')
  expect(
    await imported.evaluate((el) => getComputedStyle(el).borderImageSource),
  ).toBe(background)
  const direct = await page.textContent('.direct')
  expect(direct).toContain(
    background.match(/url\("([^"]+)"\)/)[1].replace(viteTestUrl, ''),
  )

  if (isBuild) return

  editFile('composed/shared/image.svg', (code) =>
    code.replace('width="10"', 'width="150"'),
  )
  await expect
    .poll(async () => {
      const updated = await getBg('.composed')
      return updated === background ? '' : updated
    })
    .toMatch(isBundled ? /assets\/image-[\w-]+\.svg/ : /image\.svg\?.*t=\d+/)
})

test('CSS module URL values', async () => {
  await page.goto(`${viteTestUrl}/composed/`)
  const composed = await page.waitForSelector('.composed[class*="entry"]')
  const standalone = await page.waitForSelector(
    '.standalone[class*="standalone"]',
  )
  const background = await getBg(standalone)
  const mask = await standalone.evaluate((el) => getComputedStyle(el).maskImage)
  expect(background).toMatch(
    isBundled ? /assets\/image-[\w-]+\.svg/ : '/composed/standalone/image.svg',
  )
  expect(mask).toMatch(
    isBundled ? /assets\/image-[\w-]+\.svg/ : '/composed/nested/image.svg',
  )
  expect(await getBg(composed)).toMatch(
    isBundled ? /assets\/image-[\w-]+\.svg/ : '/composed/shared/image.svg',
  )
  expect(
    await composed.evaluate((el) => getComputedStyle(el).listStyleImage),
  ).toBe(mask)
})
