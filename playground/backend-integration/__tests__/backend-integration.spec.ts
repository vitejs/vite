import { describe, expect, test, vi } from 'vitest'
import {
  browserErrors,
  browserLogs,
  editFile,
  getColor,
  isBuild,
  isServe,
  listAssets,
  page,
  ports,
  readManifest,
  serverLogs,
  untilBrowserLogAfter,
  untilUpdated,
} from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe('asset imports from js', () => {
  test('file outside root', async () => {
    // assert valid image src https://github.com/microsoft/playwright/issues/6046#issuecomment-1799585719
    await vi.waitUntil(() =>
      page
        .locator('.asset-reference.outside-root .asset-preview')
        .evaluate((el: HTMLImageElement) => el.naturalWidth > 0),
    )

    const text = await page.textContent(
      '.asset-reference.outside-root .asset-url',
    )
    if (isBuild) {
      expect(text).toMatch(/\/dev\/assets\/logo-[-\w]{8}\.png/)
    } else {
      // asset url is prefixed with server.origin
      expect(text).toMatch(
        `http://localhost:${ports['backend-integration']}/dev/@fs/`,
      )
      expect(text).toMatch(/\/dev\/@fs\/.+?\/images\/logo\.png/)
    }
  })
})

describe.runIf(isBuild)('build', () => {
  test('manifest', async () => {
    const manifest = readManifest('dev')
    const htmlEntry = manifest['index.html']
    const mainTsEntry = manifest['main.ts']
    const cssAssetEntry = manifest['global.css']
    const pcssAssetEntry = manifest['foo.pcss']
    const scssAssetEntry = manifest['nested/blue.scss']
    const imgAssetEntry = manifest['../images/logo.png']
    const dirFooAssetEntry = manifest['../../dir/foo.css']
    const iconEntrypointEntry = manifest['icon.png']
    expect(htmlEntry.css.length).toEqual(1)
    expect(htmlEntry.assets.length).toEqual(1)
    expect(mainTsEntry.assets?.length ?? 0).toBeGreaterThanOrEqual(1)
    expect(mainTsEntry.assets).toContainEqual(
      expect.stringMatching(/assets\/url-[-\w]{8}\.css/),
    )
    expect(cssAssetEntry?.file).not.toBeUndefined()
    expect(cssAssetEntry?.isEntry).toEqual(true)
    expect(pcssAssetEntry?.file).not.toBeUndefined()
    expect(pcssAssetEntry?.isEntry).toEqual(true)
    expect(scssAssetEntry?.file).not.toBeUndefined()
    expect(scssAssetEntry?.src).toEqual('nested/blue.scss')
    expect(scssAssetEntry?.isEntry).toEqual(true)
    expect(imgAssetEntry?.file).not.toBeUndefined()
    expect(imgAssetEntry?.isEntry).toBeUndefined()
    expect(dirFooAssetEntry).not.toBeUndefined() // '\\' should not be used even on windows
    // use the entry name
    expect(dirFooAssetEntry.file).toMatch('assets/bar-')
    expect(iconEntrypointEntry?.file).not.toBeUndefined()
  })

  test('CSS imported from JS entry should have a non-nested chunk name', () => {
    const manifest = readManifest('dev')
    const mainTsEntryCss = manifest['nested/sub.ts'].css
    expect(mainTsEntryCss.length).toBe(1)
    expect(mainTsEntryCss[0].replace('assets/', '')).not.toContain('/')
  })

  test('entrypoint assets should not generate empty JS file', () => {
    expect(serverLogs).not.toContainEqual(
      'Generated an empty chunk: "icon.png".',
    )

    const assets = listAssets('dev')
    expect(assets).not.toContainEqual(
      expect.stringMatching(/icon.png-[-\w]{8}\.js$/),
    )
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
