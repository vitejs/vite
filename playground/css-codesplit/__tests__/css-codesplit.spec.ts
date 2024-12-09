import { describe, expect, test } from 'vitest'
import {
  findAssetFile,
  getColor,
  isBuild,
  listAssets,
  page,
  readManifest,
  untilUpdated,
} from '~utils'

test('should load all stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
  expect(await getColor('.dynamic')).toBe('green')
  expect(await getColor('.async-js')).toBe('blue')
  expect(await getColor('.chunk')).toBe('magenta')
})

test('should load dynamic import with inline', async () => {
  const css = await page.textContent('.dynamic-inline')
  expect(css).toMatch('.inline')

  expect(await getColor('.inline')).not.toBe('yellow')
})

test('should load dynamic import with module', async () => {
  const css = await page.textContent('.dynamic-module')
  expect(css).toMatch('_mod_')

  expect(await getColor('.mod')).toBe('yellow')
})

test('style order should be consistent when style tag is inserted by JS', async () => {
  expect(await getColor('.order-bulk')).toBe('orange')
  await page.click('.order-bulk-update')
  await untilUpdated(() => getColor('.order-bulk'), 'green')
})

describe.runIf(isBuild)('build', () => {
  test('should remove empty chunk', async () => {
    expect(findAssetFile(/style-.*\.js$/)).toBe('')
    expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile('other.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile(/async-[-\w]{8}\.js$/)).toBe('')

    const assets = listAssets()
    expect(assets).not.toContainEqual(
      expect.stringMatching(/async-js-[-\w]{8}\.js$/),
    )
  })

  test('should remove empty chunk, HTML without JS', async () => {
    const sharedCSSWithJSChunk = findAssetFile('shared-css-with-js.*.js$')
    expect(sharedCSSWithJSChunk).toMatch(`/* empty css`)
    // there are functions and modules in the src code that should be tree-shaken
    expect(sharedCSSWithJSChunk).not.toMatch('function')
    expect(sharedCSSWithJSChunk).not.toMatch(/import(?!".\/modulepreload)/)
  })

  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    expect(manifest['index.html'].css.length).toBe(2)
    expect(manifest['other.js'].css.length).toBe(1)
  })

  test('should not mark a css chunk with ?url and normal import as pure css chunk', () => {
    expect(findAssetFile(/chunk-.*\.js$/)).toBeTruthy()
  })
})
