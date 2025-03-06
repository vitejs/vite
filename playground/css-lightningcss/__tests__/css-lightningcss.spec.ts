import { expect, test } from 'vitest'
import {
  editFile,
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  page,
  untilUpdated,
  viteTestUrl,
} from '~utils'

// note: tests should retrieve the element at the beginning of test and reuse it
// in later assertions to ensure CSS HMR doesn't reload the page
test('linked css', async () => {
  const linked = await page.$('.linked')
  const atImport = await page.$('.linked-at-import')

  expect(await getColor(linked)).toBe('blue')
  expect(await getColor(atImport)).toBe('red')

  if (isBuild) return
  editFile('linked.css', (code) => code.replace('color: blue', 'color: red'))
  await untilUpdated(() => getColor(linked), 'red')

  editFile('linked-at-import.css', (code) =>
    code.replace('color: red', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css import from js', async () => {
  const imported = await page.$('.imported')
  const atImport = await page.$('.imported-at-import')

  expect(await getColor(imported)).toBe('green')
  expect(await getColor(atImport)).toBe('purple')

  if (isBuild) return
  editFile('imported.css', (code) => code.replace('color: green', 'color: red'))
  await untilUpdated(() => getColor(imported), 'red')

  editFile('imported-at-import.css', (code) =>
    code.replace('color: purple', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css modules', async () => {
  const imported = await page.$('.modules')
  expect(await getColor(imported)).toBe('turquoise')

  expect(await imported.getAttribute('class')).toMatch(/\w{6}_apply-color/)

  if (isBuild) return
  editFile('mod.module.css', (code) =>
    code.replace('color: turquoise', 'color: red'),
  )
  await untilUpdated(() => getColor(imported), 'red')
})

test('inline css modules', async () => {
  const css = await page.textContent('.modules-inline')
  expect(css).toMatch(/\._?\w{6}_apply-color-inline/)
})

test.runIf(isBuild)('minify css', async () => {
  // should keep the rgba() syntax
  const cssFile = findAssetFile(/index-[-\w]+\.css$/)
  expect(cssFile).toMatch('rgba(')
  expect(cssFile).not.toMatch('#ffff00b3')
})

test('css with external url', async () => {
  const css = await page.$('.external')
  expect(await getBg(css)).toMatch('url("https://vite.dev/logo.svg")')
})

test('nested css with relative asset', async () => {
  const css = await page.$('.nested-css-relative-asset')
  expect(await getBg(css)).toMatch(
    isBuild ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
  )
})

test('aliased asset', async () => {
  const bg = await getBg('.css-url-aliased')
  expect(bg).toMatch('data:image/svg+xml,')
})

test('preinlined SVG', async () => {
  expect(await getBg('.css-url-preinlined-svg')).toMatch(
    /data:image\/svg\+xml,.+/,
  )
})
