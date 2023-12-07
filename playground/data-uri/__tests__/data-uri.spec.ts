import { expect, test } from 'vitest'
import { findAssetFile, isBuild, page } from '~utils'

test('plain', async () => {
  expect(await page.textContent('.plain')).toBe('hi')
})

test('base64', async () => {
  expect(await page.textContent('.base64')).toBe('hi')
})

test('svg data uri minify', async () => {
  const oneApos = await page.getByTestId('one-apos').boundingBox()
  const twoApos = await page.getByTestId('two-apos').boundingBox()

  expect(oneApos.height).toBe(100)
  expect(twoApos.height).toBe(100)
})

test.runIf(isBuild)('should compile away the import for build', async () => {
  const file = findAssetFile('index')
  expect(file).not.toMatch('import')
})
