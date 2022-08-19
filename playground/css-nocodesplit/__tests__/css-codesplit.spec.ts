import { describe, expect, test } from 'vitest'
import { findAssetFile, getColor, isBuild, page, readManifest } from '~utils'

test('should load all stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
  expect(await getColor('.dynamic')).toBe('green')
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

describe.runIf(isBuild)('build', () => {
  test('should emit style.css named by assetFileNames', () => {
    expect(findAssetFile(/index\.hash\.css$/).trim()).not.toBe('')
  })

  test('should remove empty chunk', async () => {
    expect(findAssetFile(/style.*\.js$/).trim()).toBe('')
    expect(findAssetFile('main.*.js$')).not.toMatch(`/* empty css`)
    expect(findAssetFile('other.*.js$')).not.toMatch(`/* empty css`)
    expect(findAssetFile(/async.*\.js$/)).not.toBe('')
  })

  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    expect(manifest['index.html']?.css?.length || 0).toBe(0)
    expect(manifest['other.js']?.css?.length || 0).toBe(0)
  })
})
