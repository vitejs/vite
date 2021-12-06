import {
  editFile,
  getColor,
  isBuild,
  readManifest,
  untilUpdated,
  mochaSetup,
  mochaReset
} from '../../testUtils'

const outerAssetMatch = isBuild
  ? /\/dev\/assets\/logo\.\w{8}\.png/
  : /\/dev\/@fs\/.+?\/images\/logo\.png/

describe('backend-integration.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should have no 404s', () => {
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  describe('asset imports from js', () => {
    it('file outside root', async () => {
      expect(
        await page.textContent('.asset-reference.outside-root .asset-url')
      ).toMatch(outerAssetMatch)
    })
  })

  if (isBuild) {
    it('manifest', async () => {
      const manifest = readManifest('dev')
      const htmlEntry = manifest['index.html']
      expect(htmlEntry.css.length).toEqual(1)
      expect(htmlEntry.assets.length).toEqual(1)
    })
  } else {
    describe('CSS HMR', () => {
      it('preserve the base in CSS HMR', async () => {
        await untilUpdated(() => getColor('body'), 'black') // sanity check
        editFile('frontend/entrypoints/global.css', (code) =>
          code.replace('black', 'red')
        )
        await untilUpdated(() => getColor('body'), 'red') // successful HMR

        // Verify that the base (/dev/) was added during the css-update
        const link = await page.$('link[rel="stylesheet"]')
        expect(await link.getAttribute('href')).toContain('/dev/global.css?t=')
      })

      it('CSS dependencies are tracked for HMR', async () => {
        const el = await page.$('h1')
        browserLogs.length = 0

        editFile('frontend/entrypoints/main.ts', (code) =>
          code.replace('text-black', 'text-[rgb(204,0,0)]')
        )
        await untilUpdated(() => getColor(el), 'rgb(204, 0, 0)')
        expect(browserLogs).toContain('[vite] css hot updated: /global.css')
      })
    })
  }
})
