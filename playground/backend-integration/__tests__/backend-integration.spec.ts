import {
  browserErrors,
  browserLogs,
  editFile,
  getColor,
  isBuild,
  isServe,
  page,
  readManifest,
  untilUpdated
} from '~utils'

const outerAssetMatch = isBuild
  ? /\/dev\/assets\/logo\.\w{8}\.png/
  : /\/dev\/@fs\/.+?\/images\/logo\.png/

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe('asset imports from js', () => {
  test('file outside root', async () => {
    expect(
      await page.textContent('.asset-reference.outside-root .asset-url')
    ).toMatch(outerAssetMatch)
  })
})

describe.runIf(isBuild)('build', () => {
  test('manifest', async () => {
    const manifest = readManifest('dev')
    const htmlEntry = manifest['index.html']
    expect(htmlEntry.css.length).toEqual(1)
    expect(htmlEntry.assets.length).toEqual(1)
  })
})

describe.runIf(isServe)('serve', () => {
  test('No ReferenceError', async () => {
    browserErrors.forEach((error) => {
      expect(error.name).not.toBe('ReferenceError')
    })
  })

  test('preserve the base in CSS HMR', async () => {
    await untilUpdated(() => getColor('body'), 'black') // sanity check
    editFile('frontend/entrypoints/global.css', (code) =>
      code.replace('black', 'red')
    )
    await untilUpdated(() => getColor('body'), 'red') // successful HMR

    // Verify that the base (/dev/) was added during the css-update
    const link = await page.$('link[rel="stylesheet"]')
    expect(await link.getAttribute('href')).toContain('/dev/global.css?t=')
  })

  test('CSS dependencies are tracked for HMR', async () => {
    const el = await page.$('h1')
    browserLogs.length = 0

    editFile('frontend/entrypoints/main.ts', (code) =>
      code.replace('text-black', 'text-[rgb(204,0,0)]')
    )
    await untilUpdated(() => getColor(el), 'rgb(204, 0, 0)')
    expect(browserLogs).toContain('[vite] css hot updated: /global.css')
  })
})
