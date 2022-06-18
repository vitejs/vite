import { findAssetFile, getColor, isBuild } from '~utils'

test('should load both stylesheets', async () => {
  expect(await getColor('h1')).toBe('red')
  expect(await getColor('h2')).toBe('blue')
})

if (isBuild) {
  test('should generate correct files', async () => {
    expect(findAssetFile(/style.*\.js$/)).toMatch('h2{color')
    expect(findAssetFile('main.*.js$')).toMatch('h1{color')

    const bothImportStyle = findAssetFile('other.*.js$').replace('\n', '')
    expect(findAssetFile('main.*.js$')).toMatch(bothImportStyle)
  })
}
