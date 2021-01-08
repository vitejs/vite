import { isBuild, findAssetFile } from '../../testUtils'

test('plain', async () => {
  expect(await page.textContent('.plain')).toBe('hi')
})

test('base64', async () => {
  expect(await page.textContent('.base64')).toBe('hi')
})

if (isBuild) {
  test('should compile away the import for build', async () => {
    const file = findAssetFile('index')
    expect(file).not.toMatch('import')
  })
}
