import { expect, test } from 'vitest'
import { getBg, isBuild, isBundledDev, page, readManifest } from '~utils'

if (isBuild) {
  test('importing asset with special char in filename works in build', async () => {
    const manifest = readManifest()
    const plusCircleAsset = manifest['+circle.svg'].file
    const underscoreCircleAsset = manifest['_circle.svg'].file
    expect(await getBg('.plus-circle')).toMatch(plusCircleAsset)
    expect(await page.textContent('.plus-circle')).toMatch(plusCircleAsset)
    expect(await getBg('.underscore-circle')).toMatch(underscoreCircleAsset)
    expect(await page.textContent('.underscore-circle')).toMatch(
      underscoreCircleAsset,
    )
    expect(plusCircleAsset).toMatch('/_circle')
    expect(underscoreCircleAsset).toMatch('/_circle')
    expect(plusCircleAsset).not.toEqual(underscoreCircleAsset)
    expect(Object.keys(manifest).length).toBe(3) // 2 svg, 1 index.js
  })
} else if (isBundledDev) {
  // bundled dev sanitizes and hashes filenames like build, but it writes no manifest file to read
  test('importing asset with special char in filename works in bundled dev', async () => {
    const plusCircleAsset = await page.textContent('.plus-circle')
    const underscoreCircleAsset = await page.textContent('.underscore-circle')
    expect(plusCircleAsset).toMatch(/\/assets\/_circle-[-\w]{8}\.svg/)
    expect(underscoreCircleAsset).toMatch(/\/assets\/_circle-[-\w]{8}\.svg/)
    // only the hash tells the two files apart after sanitization
    expect(plusCircleAsset).not.toEqual(underscoreCircleAsset)
    expect(await getBg('.plus-circle')).toContain(plusCircleAsset)
    expect(await getBg('.underscore-circle')).toContain(underscoreCircleAsset)
  })
} else {
  test('importing asset with special char in filename works in dev', async () => {
    expect(await getBg('.plus-circle')).toContain('+circle.svg')
    expect(await page.textContent('.plus-circle')).toMatch('+circle.svg')
    expect(await getBg('.underscore-circle')).toContain('_circle.svg')
    expect(await page.textContent('.underscore-circle')).toMatch('_circle.svg')
  })
}

// bundled dev: the /.env request gets the SPA html fallback (200, no file content) instead of the 403 from server.fs.deny (vitejs/vite#23028)
test.runIf(!isBuild && !isBundledDev)('denied .env', async () => {
  expect(await page.textContent('.unsafe-dotenv')).toBe('403')
  expect(await page.textContent('.unsafe-dotenv-double-slash')).toBe('200') // SPA fallback
})
