import {
  findAssetFile,
  getColor,
  isBuild,
  readManifest,
  mochaSetup,
  mochaReset
} from '../../testUtils'

describe('css-codesplit-cjs.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should load both stylesheets', async () => {
    expect(await getColor('h1')).toBe('red')
    expect(await getColor('h2')).toBe('blue')
  })

  if (isBuild) {
    it('should remove empty chunk', async () => {
      expect(findAssetFile(/style.*\.js$/)).toBe('')
      expect(findAssetFile('main.*.js$')).toMatch(`/* empty css`)
      expect(findAssetFile('other.*.js$')).toMatch(`/* empty css`)
    })

    it('should generate correct manifest', async () => {
      const manifest = readManifest()
      expect(manifest['index.html'].css.length).toBe(2)
      expect(manifest['other.js'].css.length).toBe(1)
    })
  }
})
