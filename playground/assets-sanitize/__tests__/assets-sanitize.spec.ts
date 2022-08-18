import { expect, test } from 'vitest'
import { getBg, isBuild, listAssets, page } from '~utils'

if (!isBuild) {
  test('importing asset with special char in filename works', async () => {
    expect(await getBg('.circle-bg')).toContain('+circle.svg')
    expect(await page.textContent('.circle-bg')).toMatch('+circle.svg')
  })
} else {
  const expected_asset_name_RE = /_circle\.[\w]+\.svg/
  test('importing asset with special char in filename works', async () => {
    expect(await getBg('.circle-bg')).toMatch(expected_asset_name_RE)
    expect(await page.textContent('.circle-bg')).toMatch(expected_asset_name_RE)
  })
  test('asset with special char in filename gets sanitized', async () => {
    const svgs = listAssets().filter((a) => a.endsWith('.svg'))
    expect(svgs[0]).toMatch(expected_asset_name_RE)
    expect(svgs.length).toBe(1)
  })
}
