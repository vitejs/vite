import { isBuild, readManifest } from '../../testUtils'

const outerAssetMatch = isBuild
  ? /\/dev\/assets\/logo\.\w{8}\.png/
  : /\/dev\/@fs\/.+?\/images\/logo\.png/

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe('asset imports from js', () => {
  test('file outside root', async () => {
    expect(
      await page.textContent('.asset-reference.outside-root .asset-url')
    ).toMatch(outerAssetMatch)
  })
})

if (isBuild) {
  test('manifest', async () => {
    const manifest = readManifest('dev')
    const htmlEntry = manifest['index.html']
    expect(htmlEntry.css.length).toEqual(1)
    expect(htmlEntry.assets.length).toEqual(1)
  })
}
