import { describe, expect, test } from 'vitest'
import { findAssetFile, getColor, isBuild, readManifest } from '~utils'

test('should load both stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
})

describe.runIf(isBuild)('build', () => {
  test('should remove empty chunk', async () => {
    expect(findAssetFile(/style.*\.js$/)).toBe('')
    expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile('other.*.js$')).toMatch(`/* empty css`)
  })

  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    expect(manifest['index.html'].css.length).toBe(2)
    expect(manifest['other.js'].css.length).toBe(1)
  })
})
