import { describe, expect, test, vi } from 'vitest'
import {
  browserErrors,
  browserLogs,
  bundledDevUnsupported,
  editFile,
  getColor,
  getCssRuleBg,
  isBuild,
  isBundledDev,
  isServe,
  listAssets,
  page,
  ports,
  readManifest,
  serverLogs,
  untilBrowserLogAfter,
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
    } else if (isBundledDev) {
      // asset url is prefixed with server.origin
      expect(text).toMatch(
        `http://localhost:${ports['backend-integration']}/dev/assets/`,
      )
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
    const customNameAssetEntry = manifest['../../dir/custom.css']
    const iconEntrypointEntry = manifest['icon.png']
    const waterContainerEntry = manifest['water-container.svg']
    expect(htmlEntry.css).toHaveLength(1)
    expect(htmlEntry.assets).toHaveLength(1)
    expect(mainTsEntry.assets?.length ?? 0).toBeGreaterThanOrEqual(1)
    expect(mainTsEntry.assets).toContainEqual(
      expect.stringMatching(/assets\/url-[-\w]{8}\.css/),
    )
    expect(cssAssetEntry?.file).toBeDefined()
    expect(cssAssetEntry?.isEntry).toBe(true)
    expect(pcssAssetEntry?.file).toBeDefined()
    expect(pcssAssetEntry?.isEntry).toBe(true)
    expect(scssAssetEntry?.file).toBeDefined()
    expect(scssAssetEntry?.src).toBe('nested/blue.scss')
    expect(scssAssetEntry?.isEntry).toBe(true)
    expect(imgAssetEntry?.file).toBeDefined()
    expect(imgAssetEntry?.isEntry).toBeUndefined()
    expect(dirFooAssetEntry).toBeDefined() // '\\' should not be used even on windows
    // use the entry name
    expect(dirFooAssetEntry.file).toMatch('assets/bar-')
    expect(dirFooAssetEntry.name).toBe('bar.css')
    expect(dirFooAssetEntry.assets).toHaveLength(1)
    expect(customNameAssetEntry.name).toBe('bar.custom')
    expect(iconEntrypointEntry?.file).toBeDefined()
    expect(waterContainerEntry?.file).toBeDefined()
  })

  test('CSS imported from JS entry should have a non-nested chunk name', () => {
    const manifest = readManifest('dev')
    const mainTsEntryCss = manifest['nested/sub.ts'].css
    expect(mainTsEntryCss).toHaveLength(1)
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
  const cssLinkUnsupported = bundledDevUnsupported(
    'bundled dev turns a `<link rel="stylesheet">` to a project CSS file (without `media` or `disabled`) into a CSS import, served as a `<style>` injected by a JS module, so there is no `<link>` tag to swap on a CSS edit; the edit still hot updates in place',
  )

  test('No ReferenceError', async () => {
    browserErrors.forEach((error) => {
      expect(error.name).not.toBe('ReferenceError')
    })
  })

  test('preserve the base in CSS HMR', async () => {
    await expect.poll(() => getColor('body')).toBe('black') // sanity check
    editFile('frontend/entrypoints/global.css', (code) =>
      code.replace('black', 'red'),
    )
    await expect.poll(() => getColor('body')).toBe('red') // successful HMR
  })

  test(
    'preserve the base in CSS HMR link href',
    cssLinkUnsupported,
    async () => {
      // Verify that the base (/dev/) was added during the css-update
      const link = await page.$('link[rel="stylesheet"]:last-of-type')
      expect(await link.getAttribute('href')).toContain('/dev/global.css?t=')
    },
  )

  test('server.origin is applied to non-public CSS url()', async () => {
    const bg = await getCssRuleBg('.outside-root--aliased')
    expect(bg).toContain(
      `http://localhost:${ports['backend-integration']}/dev/`,
    )
  })

  test('server.origin is applied to public CSS url()', async () => {
    const bg = await getCssRuleBg('.public-asset')
    expect(bg).toContain(
      `http://localhost:${ports['backend-integration']}/dev/icon.png`,
    )
  })

  test('CSS dependencies are tracked for HMR', async () => {
    const el = await page.$('h1')
    await untilBrowserLogAfter(
      () =>
        editFile('frontend/entrypoints/main.ts', (code) =>
          code.replace('text-black', 'text-[rgb(204,0,0)]'),
        ),
      isBundledDev
        ? '[vite] hot updated: playground-temp-serve-bundled/backend-integration/frontend/entrypoints/global.css'
        : '[vite] css hot updated: /global.css',
    )
    await expect.poll(() => getColor(el)).toBe('rgb(204, 0, 0)')
  })
})
