import { expect, test } from 'vitest'
import { getBg, isBuild, page, readManifest } from '~utils'

async function expectAsset(selector, expected) {
  const [bg, text] = await Promise.all([
    getBg(selector),
    page.textContent(selector),
  ])

  expect(bg).toContain(expected)
  expect(text).toMatch(expected)
}

async function expectBuiltAsset(selector, asset) {
  const [bg, text] = await Promise.all([
    getBg(selector),
    page.textContent(selector),
  ])

  expect(bg).toMatch(asset)
  expect(text).toMatch(asset)
}

if (!isBuild) {
  test('importing asset with special char in filename works in dev', async () => {
    await Promise.all([
      expectAsset('.plus-circle', '+circle.svg'),
      expectAsset('.underscore-circle', '_circle.svg'),
    ])
  })
} else {
  test('importing asset with special char in filename works in build', async () => {
    const manifest = readManifest()

    const plusCircleAsset = manifest['+circle.svg'].file
    const underscoreCircleAsset = manifest['_circle.svg'].file

    await Promise.all([
      expectBuiltAsset('.plus-circle', plusCircleAsset),
      expectBuiltAsset('.underscore-circle', underscoreCircleAsset),])
    expect(plusCircleAsset).toMatch('/_circle')
    expect(underscoreCircleAsset).toMatch('/_circle')
    expect(plusCircleAsset).not.toEqual(underscoreCircleAsset)
    expect(Object.keys(manifest)).toHaveLength(3)
  })
}

test.runIf(!isBuild)('denied .env', async () => {
  const [dotenv, dotenvDoubleSlash] = await Promise.all([
    page.textContent('.unsafe-dotenv'),
    page.textContent('.unsafe-dotenv-double-slash'),
  ])

  expect(dotenv).toBe('403')
  expect(dotenvDoubleSlash).toBe('200') // SPA fallback
})
