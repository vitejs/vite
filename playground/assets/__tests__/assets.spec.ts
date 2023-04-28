import path from 'node:path'
import fetch from 'node-fetch'
import { describe, expect, test } from 'vitest'
import {
  browserLogs,
  editFile,
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  listAssets,
  notifyRebuildComplete,
  page,
  readFile,
  readManifest,
  untilUpdated,
  viteTestUrl,
  watcher,
} from '~utils'

const assetMatch = isBuild
  ? /\/foo\/assets\/asset-\w{8}\.png/
  : '/foo/nested/asset.png'

const iconMatch = `/foo/icon.png`

const fetchPath = (p: string) => {
  return fetch(path.posix.join(viteTestUrl, p), {
    headers: { Accept: 'text/html,*/*' },
  })
}

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('should get a 404 when using incorrect case', async () => {
  expect((await fetchPath('icon.png')).status).toBe(200)
  // won't be wrote to index.html because the url includes `.`
  expect((await fetchPath('ICON.png')).status).toBe(404)

  expect((await fetchPath('bar')).status).toBe(200)
  // fallback to index.html
  const incorrectBarFetch = await fetchPath('BAR')
  expect(incorrectBarFetch.status).toBe(200)
  expect(incorrectBarFetch.headers.get('Content-Type')).toContain('text/html')
})

describe('injected scripts', () => {
  test('@vite/client', async () => {
    const hasClient = await page.$(
      'script[type="module"][src="/foo/@vite/client"]',
    )
    if (isBuild) {
      expect(hasClient).toBeFalsy()
    } else {
      expect(hasClient).toBeTruthy()
    }
  })

  test('html-proxy', async () => {
    const hasHtmlProxy = await page.$(
      'script[type="module"][src^="/foo/index.html?html-proxy"]',
    )
    if (isBuild) {
      expect(hasHtmlProxy).toBeFalsy()
    } else {
      expect(hasHtmlProxy).toBeTruthy()
    }
  })
})

describe('raw references from /public', () => {
  test('load raw js from /public', async () => {
    expect(await page.textContent('.raw-js')).toMatch('[success]')
  })

  test('load raw css from /public', async () => {
    expect(await getColor('.raw-css')).toBe('red')
  })
})

test('import-expression from simple script', async () => {
  expect(await page.textContent('.import-expression')).toMatch(
    '[success][success]',
  )
})

describe('asset imports from js', () => {
  test('relative', async () => {
    expect(await page.textContent('.asset-import-relative')).toMatch(assetMatch)
  })

  test('absolute', async () => {
    expect(await page.textContent('.asset-import-absolute')).toMatch(assetMatch)
  })

  test('from /public', async () => {
    expect(await page.textContent('.public-import')).toMatch(iconMatch)
  })
})

describe('css url() references', () => {
  test('fonts', async () => {
    expect(
      await page.evaluate(() => {
        return (document as any).fonts.check('700 32px Inter')
      }),
    ).toBe(true)
  })

  test('relative', async () => {
    expect(await getBg('.css-url-relative')).toMatch(assetMatch)
  })

  test('image-set relative', async () => {
    const imageSet = await getBg('.css-image-set-relative')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

  test('image-set without the url() call', async () => {
    const imageSet = await getBg('.css-image-set-without-url-call')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

  test('image-set with var', async () => {
    const imageSet = await getBg('.css-image-set-with-var')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

  test('image-set with mix', async () => {
    const imageSet = await getBg('.css-image-set-mix-url-var')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

  test('image-set with base64', async () => {
    const imageSet = await getBg('.css-image-set-base64')
    expect(imageSet).toMatch(
      `-webkit-image-set(url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA0AgMAAACrwbOMAAADI2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1MDI2QjVGQTg3RUIxMUVBQUFDMkQ3NTM0MUZGNzU3RSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MDI2QjVGOTg3RUIxMUVBQUFDMkQ3NTM0MUZGNzU3RSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBNzc3MDZDRjg3QUIxMUUzQjcwREVFMDM3NzA2QzEyMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBNzc3MDZEMDg3QUIxMUUzQjcwREVFMDM3NzA2QzEyMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqfCcbEAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAADFBMVEVBuoQ0R10/qn8/qX7FyuqbAAAABHRSTlP9/QGEiU0+GwAAAPtJREFUGBkFwbFNXEEUBdDD/QSWmE7YYAogWNeAaMfaEuiD5HfAk9yIAwqYwIGRRvt8zkNdvckrzzcfjqDccdPIYnH1AJ4ywLs7m53Fhkcw0+DLDxZn0PCHQrrg2xWOCpS7m6bFAj/ZDLFY/AJbDDZ/WUzR4B84BRoURBeAo4Si0CBMFvBEGMBmExYbi0loACcBjQKhC3AUQVGaRjBhMxAsFlwQDLYFBA04EaAVEHSBoxAoPmkITBYDAovNhsAAEwINTggAINCFoyCg0CBgYoCAjQsIACCgcYKABhCgHAUClAYCTAMIsF2AAAACtBMIQAEB+jcggE9AAC+A/zyyZDSXstCbAAAAAElFTkSuQmCC") 1x, url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA0CAYAAADWr1sfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTAyNkI1RkE4N0VCMTFFQUFBQzJENzUzNDFGRjc1N0UiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTAyNkI1Rjk4N0VCMTFFQUFBQzJENzUzNDFGRjc1N0UiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QTc3NzA2Q0Y4N0FCMTFFM0I3MERFRTAzNzcwNkMxMjMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QTc3NzA2RDA4N0FCMTFFM0I3MERFRTAzNzcwNkMxMjMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6nwnGxAAAJtklEQVR42txZ6W9c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") 2x)`,
    )
  })

  // TODO: not supported in chrome
  // https://drafts.csswg.org/css-images-4/#image-set-notation
  //
  // test('image-set with multiple descriptor', async () => {
  //   const imageSet = await getBg('.css-image-set-gradient')
  //   expect(imageSet).toMatch(
  //     `-webkit-image-set(url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA0AgMAAACrwbOMAAADI2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1MDI2QjVGQTg3RUIxMUVBQUFDMkQ3NTM0MUZGNzU3RSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MDI2QjVGOTg3RUIxMUVBQUFDMkQ3NTM0MUZGNzU3RSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBNzc3MDZDRjg3QUIxMUUzQjcwREVFMDM3NzA2QzEyMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBNzc3MDZEMDg3QUIxMUUzQjcwREVFMDM3NzA2QzEyMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqfCcbEAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAADFBMVEVBuoQ0R10/qn8/qX7FyuqbAAAABHRSTlP9/QGEiU0+GwAAAPtJREFUGBkFwbFNXEEUBdDD/QSWmE7YYAogWNeAaMfaEuiD5HfAk9yIAwqYwIGRRvt8zkNdvckrzzcfjqDccdPIYnH1AJ4ywLs7m53Fhkcw0+DLDxZn0PCHQrrg2xWOCpS7m6bFAj/ZDLFY/AJbDDZ/WUzR4B84BRoURBeAo4Si0CBMFvBEGMBmExYbi0loACcBjQKhC3AUQVGaRjBhMxAsFlwQDLYFBA04EaAVEHSBoxAoPmkITBYDAovNhsAAEwINTggAINCFoyCg0CBgYoCAjQsIACCgcYKABhCgHAUClAYCTAMIsF2AAAACtBMIQAEB+jcggE9AAC+A/zyyZDSXstCbAAAAAElFTkSuQmCC") 1x, linear-gradient(#e66465, #9198e5) 2x)`
  //   )
  // })
  //
  // test('image-set with multiple descriptor', async () => {
  //   const imageSet = await getBg('.css-image-set-multiple-descriptor')
  //   imageSet.split(', ').forEach((s) => {
  //     expect(s).toMatch(assetMatch)
  //   })
  // })

  test('relative in @import', async () => {
    expect(await getBg('.css-url-relative-at-imported')).toMatch(assetMatch)
  })

  test('absolute', async () => {
    expect(await getBg('.css-url-absolute')).toMatch(assetMatch)
  })

  test('from /public', async () => {
    expect(await getBg('.css-url-public')).toMatch(iconMatch)
  })

  test('base64 inline', async () => {
    const match = isBuild ? `data:image/png;base64` : `/foo/nested/icon.png`
    expect(await getBg('.css-url-base64-inline')).toMatch(match)
    expect(await getBg('.css-url-quotes-base64-inline')).toMatch(match)
    const icoMatch = isBuild ? `data:image/x-icon;base64` : `favicon.ico`
    const el = await page.$(`link.ico`)
    const href = await el.getAttribute('href')
    expect(href).toMatch(icoMatch)
  })

  test('multiple urls on the same line', async () => {
    const bg = await getBg('.css-url-same-line')
    expect(bg).toMatch(assetMatch)
    expect(bg).toMatch(iconMatch)
  })

  test('aliased', async () => {
    const bg = await getBg('.css-url-aliased')
    expect(bg).toMatch(assetMatch)
  })

  test.runIf(isBuild)('generated paths in CSS', () => {
    const css = findAssetFile(/\.css$/, 'foo')

    // preserve postfix query/hash
    expect(css).toMatch(`woff2?#iefix`)

    // generate non-relative base for public path in CSS
    expect(css).not.toMatch(`../icon.png`)
  })
})

describe('image', () => {
  test('srcset', async () => {
    const img = await page.$('.img-src-set')
    const srcset = await img.getAttribute('srcset')
    srcset.split(', ').forEach((s) => {
      expect(s).toMatch(
        isBuild
          ? /\/foo\/assets\/asset-\w{8}\.png \dx/
          : /\/foo\/nested\/asset.png \dx/,
      )
    })
  })
})

describe('svg fragments', () => {
  // 404 is checked already, so here we just ensure the urls end with #fragment
  test('img url', async () => {
    const img = await page.$('.svg-frag-img')
    expect(await img.getAttribute('src')).toMatch(/svg#icon-clock-view$/)
  })

  test('via css url()', async () => {
    const bg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('.icon')).backgroundImage
    })
    expect(bg).toMatch(/svg#icon-clock-view"\)$/)
  })

  test('from js import', async () => {
    const img = await page.$('.svg-frag-import')
    expect(await img.getAttribute('src')).toMatch(/svg#icon-heart-view$/)
  })
})

test('Unknown extension assets import', async () => {
  expect(await page.textContent('.unknown-ext')).toMatch(
    isBuild ? 'data:application/octet-stream;' : '/nested/foo.unknown',
  )
})

test('?raw import', async () => {
  expect(await page.textContent('.raw')).toMatch('SVG')
})

test('?url import', async () => {
  const src = readFile('foo.js')
  expect(await page.textContent('.url')).toMatch(
    isBuild
      ? `data:application/javascript;base64,${Buffer.from(src).toString(
          'base64',
        )}`
      : `/foo/foo.js`,
  )
})

test('?url import on css', async () => {
  const src = readFile('css/icons.css')
  const txt = await page.textContent('.url-css')
  expect(txt).toEqual(
    isBuild
      ? `data:text/css;base64,${Buffer.from(src).toString('base64')}`
      : '/foo/css/icons.css',
  )
})

describe('unicode url', () => {
  test('from js import', async () => {
    const src = readFile('テスト-測試-white space.js')
    expect(await page.textContent('.unicode-url')).toMatch(
      isBuild
        ? `data:application/javascript;base64,${Buffer.from(src).toString(
            'base64',
          )}`
        : `/foo/テスト-測試-white space.js`,
    )
  })
})

describe.runIf(isBuild)('encodeURI', () => {
  test('img src with encodeURI', async () => {
    const img = await page.$('.encodeURI')
    expect(
      (await img.getAttribute('src')).startsWith('data:image/png;base64'),
    ).toBe(true)
  })
})

test('new URL(..., import.meta.url)', async () => {
  expect(await page.textContent('.import-meta-url')).toMatch(assetMatch)
})

test('new URL("@/...", import.meta.url)', async () => {
  expect(await page.textContent('.import-meta-url-dep')).toMatch(assetMatch)
})

test('new URL("/...", import.meta.url)', async () => {
  expect(await page.textContent('.import-meta-url-base-path')).toMatch(
    iconMatch,
  )
})

test('new URL(`${dynamic}`, import.meta.url)', async () => {
  expect(await page.textContent('.dynamic-import-meta-url-1')).toMatch(
    isBuild ? 'data:image/png;base64' : '/foo/nested/icon.png',
  )
  expect(await page.textContent('.dynamic-import-meta-url-2')).toMatch(
    assetMatch,
  )
  expect(await page.textContent('.dynamic-import-meta-url-js')).toMatch(
    isBuild ? 'data:application/javascript;base64' : '/foo/nested/test.js',
  )
})

test('new URL(`./${dynamic}?abc`, import.meta.url)', async () => {
  expect(await page.textContent('.dynamic-import-meta-url-1-query')).toMatch(
    isBuild ? 'data:image/png;base64' : '/foo/nested/icon.png?abc',
  )
  expect(await page.textContent('.dynamic-import-meta-url-2-query')).toMatch(
    isBuild
      ? /\/foo\/assets\/asset-\w{8}\.png\?abc/
      : '/foo/nested/asset.png?abc',
  )
})

test('new URL(`non-existent`, import.meta.url)', async () => {
  expect(await page.textContent('.non-existent-import-meta-url')).toMatch(
    new URL('non-existent', page.url()).pathname,
  )
})

test.runIf(isBuild)('manifest', async () => {
  const manifest = readManifest('foo')
  const entry = manifest['index.html']

  for (const file of listAssets('foo')) {
    if (file.endsWith('.css')) {
      expect(entry.css).toContain(`assets/${file}`)
    } else if (!file.endsWith('.js')) {
      expect(entry.assets).toContain(`assets/${file}`)
    }
  }
})

describe.runIf(isBuild)('css and assets in css in build watch', () => {
  test('css will not be lost and css does not contain undefined', async () => {
    editFile('index.html', (code) => code.replace('Assets', 'assets'), true)
    await notifyRebuildComplete(watcher)
    const cssFile = findAssetFile(/index-\w+\.css$/, 'foo')
    expect(cssFile).not.toBe('')
    expect(cssFile).not.toMatch(/undefined/)
  })

  test('import module.css', async () => {
    expect(await getColor('#foo')).toBe('red')
    editFile('css/foo.module.css', (code) => code.replace('red', 'blue'), true)
    await notifyRebuildComplete(watcher)
    await page.reload()
    expect(await getColor('#foo')).toBe('blue')
  })

  test('import with raw query', async () => {
    expect(await page.textContent('.raw-query')).toBe('foo')
    editFile('static/foo.txt', (code) => code.replace('foo', 'zoo'), true)
    await notifyRebuildComplete(watcher)
    await page.reload()
    expect(await page.textContent('.raw-query')).toBe('zoo')
  })
})

test('inline style test', async () => {
  expect(await getBg('.inline-style')).toMatch(assetMatch)
  expect(await getBg('.style-url-assets')).toMatch(assetMatch)
})

if (!isBuild) {
  test('@import in html style tag hmr', async () => {
    await untilUpdated(() => getColor('.import-css'), 'rgb(0, 136, 255)')
    editFile(
      './css/import.css',
      (code) => code.replace('#0088ff', '#00ff88'),
      true,
    )
    await page.waitForNavigation()
    await untilUpdated(() => getColor('.import-css'), 'rgb(0, 255, 136)')
  })
}

test('html import word boundary', async () => {
  expect(await page.textContent('.obj-import-express')).toMatch(
    'ignore object import prop',
  )
  expect(await page.textContent('.string-import-express')).toMatch('no load')
})

test('relative path in html asset', async () => {
  expect(await page.textContent('.relative-js')).toMatch('hello')
  expect(await getColor('.relative-css')).toMatch('red')
})

test('url() contains file in publicDir, in <style> tag', async () => {
  expect(await getBg('.style-public-assets')).toContain(iconMatch)
})

test.skip('url() contains file in publicDir, as inline style', async () => {
  // TODO: To investigate why `await getBg('.inline-style-public') === "url("http://localhost:5173/icon.png")"`
  // It supposes to be `url("http://localhost:5173/foo/icon.png")`
  // (I built the playground to verify)
  expect(await getBg('.inline-style-public')).toContain(iconMatch)
})

test.runIf(isBuild)('assets inside <noscript> is rewrote', async () => {
  const indexHtml = readFile('./dist/foo/index.html')
  expect(indexHtml).toMatch(
    /<img class="noscript" src="\/foo\/assets\/asset-\w+\.png" \/>/,
  )
})
