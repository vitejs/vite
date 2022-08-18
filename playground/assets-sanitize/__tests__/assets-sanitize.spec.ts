import { expect, test } from 'vitest'
import { getBg, isBuild, page, readManifest } from '~utils'

if (!isBuild) {
  test('importing asset with special char in filename works in dev', async () => {
    expect(await getBg('.plus-circle')).toContain('+circle.svg')
    expect(await page.textContent('.plus-circle')).toMatch('+circle.svg')
    expect(await getBg('.underscore-circle')).toContain('_circle.svg')
    expect(await page.textContent('.underscore-circle')).toMatch('_circle.svg')
  })
} else {
  test('importing asset with special char in filename works in build', async () => {
    const manifest = readManifest()
    const plusCircleAsset = manifest['+circle.svg'].file
    const underscoreCircleAsset = manifest['_circle.svg'].file
    expect(await getBg('.plus-circle')).toMatch(plusCircleAsset)
    expect(await page.textContent('.plus-circle')).toMatch(plusCircleAsset)
    expect(await getBg('.underscore-circle')).toMatch(underscoreCircleAsset)
    expect(await page.textContent('.underscore-circle')).toMatch(
      underscoreCircleAsset
    )
    expect(plusCircleAsset).toMatch('/_circle')
    expect(underscoreCircleAsset).toMatch('/_circle')
    expect(plusCircleAsset).not.toBe(underscoreCircleAsset)
    expect(Object.keys(manifest).length).toBe(3) // 2 svg, 1 index.js
  })
}
