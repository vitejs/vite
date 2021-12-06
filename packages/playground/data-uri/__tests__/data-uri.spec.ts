import { isBuild, findAssetFile, mochaReset, mochaSetup } from '../../testUtils'

describe('data-uri.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('plain', async () => {
    expect(await page.textContent('.plain')).toBe('hi')
  })

  it('base64', async () => {
    expect(await page.textContent('.base64')).toBe('hi')
  })

  if (isBuild) {
    it('should compile away the import for build', async () => {
      const file = findAssetFile('index')
      expect(file).not.toMatch('import')
    })
  }
})
