import { expect, test } from 'vitest'
import { findAssetFile, isBuild, page } from '~utils'

test('plain', async () => {
  expect(await page.textContent('.plain')).toBe('hi')
})

test('base64', async () => {
  expect(await page.textContent('.base64')).toBe('hi')
})

test('svg data uri minify', async () => {
  const sqdqs = await page.getByTestId('sqdqs').boundingBox()
  const sqsdqs = await page.getByTestId('sqsdqs').boundingBox()
  const dqsqs = await page.getByTestId('dqsqs').boundingBox()
  const dqssqs = await page.getByTestId('dqssqs').boundingBox()

  expect(sqdqs.height).toBe(100)
  expect(sqsdqs.height).toBe(100)
  expect(dqsqs.height).toBe(100)
  expect(dqssqs.height).toBe(100)
})

test.runIf(isBuild)('should compile away the import for build', async () => {
  const file = findAssetFile('index')
  expect(file).not.toMatch('import')
})
