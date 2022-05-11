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
  test('should remove empty chunk', async () => {
    expect(findAssetFile(/style.*\.js$/)).toBe('')
    expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile('other.*.js$')).toMatch(`/* empty css`)
    expect(findAssetFile(/async.*\.js$/)).toBe('')
  })

  test('should generate correct manifest', async () => {
    const manifest = readManifest()
    expect(manifest['index.html'].css.length).toBe(2)
    expect(manifest['other.js'].css.length).toBe(1)
  })
})
