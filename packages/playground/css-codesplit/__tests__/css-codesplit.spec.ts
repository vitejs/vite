import fs from 'fs'
import path from 'path'
import { findAssetFile, getColor, isBuild, testDir } from '../../testUtils'

test('should load both stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
})

if (isBuild) {
  test('should remove empty chunk', async () => {
    expect(findAssetFile(/style.*\.js$/)).toBe('')
    expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile('other.*.js$')).toMatch(`/* empty css`)
  })

  test('should generate correct manifest', async () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(testDir, 'dist', 'manifest.json'), 'utf-8')
    )
    expect(manifest['index.html'].css.length).toBe(2)
    expect(manifest['other.js'].css.length).toBe(1)
  })
}
