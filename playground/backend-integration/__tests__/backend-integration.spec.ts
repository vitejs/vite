import { describe, expect, test } from 'vitest'
import {
  browserErrors,
  browserLogs,
  editFile,
  getColor,
  isBuild,
  isServe,
  page,
  readManifest,
  untilBrowserLogAfter,
  untilUpdated,
} from '~utils'

const outerAssetMatch = isBuild
  ? /\/dev\/assets\/logo-\w{8}\.png/
  : /\/dev\/@fs\/.+?\/images\/logo\.png/

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe('asset imports from js', () => {
  test('file outside root', async () => {
    expect(
      await page.textContent('.asset-reference.outside-root .asset-url'),
    ).toMatch(outerAssetMatch)
  })
})

describe.runIf(isBuild)('build', () => {
  test('manifest', async () => {
    const manifest = readManifest('dev')
    const htmlEntry = manifest['index.html']
    const cssAssetEntry = manifest['global.css']
    const scssAssetEntry = manifest['nested/blue.scss']
    const imgAssetEntry = manifest['../images/logo.png']
    const dirFooAssetEntry = manifest['../dynamic/foo.css'] // '\\' should not be used even on windows
    expect(htmlEntry.css.length).toEqual(1)
    expect(htmlEntry.assets.length).toEqual(1)
    expect(cssAssetEntry?.file).not.toBeUndefined()
    expect(cssAssetEntry?.isEntry).toEqual(true)
    expect(scssAssetEntry?.file).not.toBeUndefined()
    expect(scssAssetEntry?.src).toEqual('nested/blue.scss')
    expect(scssAssetEntry?.isEntry).toEqual(true)
    expect(imgAssetEntry?.file).not.toBeUndefined()
    expect(imgAssetEntry?.isEntry).toBeUndefined()
    expect(dirFooAssetEntry).not.toBeUndefined()
    // use the entry name
    expect(manifest['bar.css']).not.toBeUndefined()
    expect(manifest['foo.css']).toBeUndefined()
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
      code.replace('black', 'red'),
    )
    await untilUpdated(() => getColor('body'), 'red') // successful HMR

    // Verify that the base (/dev/) was added during the css-update
    const link = await page.$('link[rel="stylesheet"]:last-of-type')
    expect(await link.getAttribute('href')).toContain('/dev/global.css?t=')
  })

  test('CSS dependencies are tracked for HMR', async () => {
    const el = await page.$('h1')
    await untilBrowserLogAfter(
      () =>
        editFile('frontend/entrypoints/main.ts', (code) =>
          code.replace('text-black', 'text-[rgb(204,0,0)]'),
        ),
      '[vite] css hot updated: /global.css',
    )
    await untilUpdated(() => getColor(el), 'rgb(204, 0, 0)')
  })
})
