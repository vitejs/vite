import { describe, expect, test } from 'vitest'
import { getBgColor, isBuild, readFile } from '~utils'

test('source-import order wins in the cascade', async () => {
  // `main.js` does `import './vendor.js'` (which imports vendor.css with
  // background: red) and then `import './override.css'` (background: blue).
  // If link tags load in source order, override wins -> blue.
  expect(await getBgColor('.box')).toBe('blue')
})

describe.runIf(isBuild)('build', () => {
  // Regression for https://github.com/vitejs/vite/issues/4890. With two
  // entries sharing the same imports, the historical bug placed the
  // override stylesheet before the vendor stylesheet in the built HTML -
  // reversing the cascade so vendor's red defeated override's blue.
  for (const htmlPath of ['dist/index.html', 'dist/entry2/index.html']) {
    test(`${htmlPath} lists vendor.css before override.css`, () => {
      const html = readFile(htmlPath)
      const vendorIdx = html.search(
        /<link[^>]+href=["'][^"']*\/vendor-[^"']+\.css["']/,
      )
      const overrideIdx = html.search(
        /<link[^>]+href=["'][^"']*\/override-[^"']+\.css["']/,
      )
      expect(vendorIdx, 'vendor link should be present').toBeGreaterThanOrEqual(
        0,
      )
      expect(
        overrideIdx,
        'override link should be present',
      ).toBeGreaterThanOrEqual(0)
      expect(vendorIdx).toBeLessThan(overrideIdx)
    })
  }
})
