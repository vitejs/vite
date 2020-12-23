import fs from 'fs'
import path from 'path'
import { getBg, getColor, isBuild, testDir } from '../../testUtils'

const assetMatch = isBuild
  ? /\/foo\/assets\/asset\.\w{8}\.png/
  : '/nested/asset.png'

const iconMatch = isBuild ? `/foo/icon.png` : `icon.png`

test('should have no 404s', () => {
  pageLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('load raw js from /public', async () => {
  expect(await page.textContent('.raw-js')).toMatch('[success]')
})

test('load raw css from /public', async () => {
  expect(await getColor('.raw-css')).toBe('red')
})

test('fonts referenced from css', async () => {
  expect(
    await page.evaluate(() => {
      return (document as any).fonts.check('700 32px Inter')
    })
  ).toBe(true)
})

test('assset import from js (relative)', async () => {
  expect(await page.textContent('.asset-import-relative')).toMatch(assetMatch)
})

test('asset import from js (absolute)', async () => {
  expect(await page.textContent('.asset-import-absolute')).toMatch(assetMatch)
})

test('/public asset import from js', async () => {
  expect(await page.textContent('.public-import')).toMatch(iconMatch)
})

test('css relative url()', async () => {
  expect(await getBg('.css-url-relative')).toMatch(assetMatch)
})

test('css absolute url()', async () => {
  expect(await getBg('.css-url-absolute')).toMatch(assetMatch)
})

test('css public url()', async () => {
  expect(await getBg('.css-url-public')).toMatch(iconMatch)
})

test('css url() base64 inline', async () => {
  const match = isBuild ? `data:image/png;base64` : `/icon.png`
  expect(await getBg('.css-url-base64-inline')).toMatch(match)
})

if (isBuild) {
  test('css url should preserve postfix query/hash', () => {
    const assetsDir = path.resolve(testDir, 'dist/foo/assets')
    const files = fs.readdirSync(assetsDir)
    const file = files.find((file) => {
      return /style\.\w+\.css/.test(file)
    })
    expect(fs.readFileSync(path.resolve(assetsDir, file), 'utf-8')).toMatch(
      `woff2?#iefix`
    )
  })
}
