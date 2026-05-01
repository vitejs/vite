import { describe, expect, test } from 'vitest'
import { findAssetFile, getColor, isBuild, listAssets } from '~utils'

test('should load all stylesheets', async () => {
  expect(await getColor('.shared-linked')).toBe('blue')
  await expect.poll(() => getColor('.async-js')).toBe('blue')
})

describe.runIf(isBuild)('build', () => {
  test('should remove empty chunk', async () => {
    const assets = listAssets()
    expect(assets).not.toContainEqual(
      expect.stringMatching(/shared-linked-.*\.js$/),
    )
    expect(assets).not.toContainEqual(expect.stringMatching(/async-js-.*\.js$/))
  })

  // regression test for https://github.com/vitejs/vite/issues/22301
  // `order-static.js` imports `order-static-base.css` (red) first, then
  // `order-static-dep.js` (force-split into its own chunk because it is also
  // a build input) which imports `order-static-dep.css` (green). The merged
  // CSS bundle must place `base` before `dep` so the rule from the later
  // source-import wins.
  test('should preserve source-import order across force-split chunks', () => {
    const css = findAssetFile(/style-[-\w]+\.css$/)
    const baseIdx = css.indexOf('.order-static')
    const depIdx = css.indexOf('.order-static', baseIdx + 1)
    expect(baseIdx).toBeGreaterThanOrEqual(0)
    if (depIdx >= 0) {
      // unminified bundle: both rules are present in source-import order
      expect(css.slice(baseIdx, depIdx)).toContain('red')
      expect(css.slice(depIdx)).toContain('green')
    } else {
      // minified bundle: duplicate `.order-static` rules collapse and
      // the last (later-source-order) rule wins
      expect(css).toContain('green')
      expect(css).not.toContain('red')
    }
  })
})
