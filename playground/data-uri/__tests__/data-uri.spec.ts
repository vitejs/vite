import { findAssetFile, isBuild, page } from '~utils'

test('plain', async () => {
  expect(await page.textContent('.plain')).toBe('hi')
})

test('base64', async () => {
  expect(await page.textContent('.base64')).toBe('hi')
})

test.runIf(isBuild)('should compile away the import for build', async () => {
  const file = findAssetFile('index')
  expect(file).not.toMatch('import')
})
