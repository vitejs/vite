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
  isServe,
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
  ? /\/foo\/bar\/assets\/asset-[-\w]{8}\.png/
  : '/foo/bar/nested/asset.png'

const iconMatch = `/foo/bar/icon.png`

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
  expect((await fetchPath('icon.png')).headers.get('Content-Type')).toBe(
    'image/png',
  )
  // fallback to index.html
  const iconPngResult = await fetchPath('ICON.png')
  expect(iconPngResult.headers.get('Content-Type')).toBe('text/html')
  expect(iconPngResult.status).toBe(200)

  expect((await fetchPath('bar')).headers.get('Content-Type')).toBe('')
  // fallback to index.html
  const barResult = await fetchPath('BAR')
  expect(barResult.headers.get('Content-Type')).toContain('text/html')
  expect(barResult.status).toBe(200)
})

test('should fallback to index.html when accessing non-existant html file', async () => {
  expect((await fetchPath('doesnt-exist.html')).status).toBe(200)
})

describe.runIf(isServe)('outside base', () => {
  test('should get a 404 with html', async () => {
    const res = await fetch(new URL('/baz', viteTestUrl), {
      headers: { Accept: 'text/html,*/*' },
    })
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('text/html')
  })

  test('should get a 404 with text', async () => {
    const res = await fetch(new URL('/baz', viteTestUrl))
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('text/plain')
  })
})

describe('injected scripts', () => {
  test('@vite/client', async () => {
    const hasClient = await page.$(
      'script[type="module"][src="/foo/bar/@vite/client"]',
    )
    if (isBuild) {
      expect(hasClient).toBeFalsy()
    } else {
      expect(hasClient).toBeTruthy()
    }
  })

  test('html-proxy', async () => {
    const hasHtmlProxy = await page.$(
      'script[type="module"][src^="/foo/bar/index.html?html-proxy"]',
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

  test('from /public (json)', async () => {
    expect(await page.textContent('.public-json-import')).toMatch(
      '/foo/bar/foo.json',
    )
    expect(await page.textContent('.public-json-import-content'))
      .toMatchInlineSnapshot(`
        "{
          "foo": "bar"
        }
        "
      `)
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
    expect(imageSet).toContain('image-set(url("data:image/png;base64,')
  })

  test('image-set with gradient', async () => {
    const imageSet = await getBg('.css-image-set-gradient')
    expect(imageSet).toContain('image-set(url("data:image/png;base64,')
  })

  test('image-set with multiple descriptor', async () => {
    const imageSet = await getBg('.css-image-set-multiple-descriptor')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

  test('image-set with multiple descriptor as inline style', async () => {
    const imageSet = await getBg(
      '.css-image-set-multiple-descriptor-inline-style',
    )
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(assetMatch)
    })
  })

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
    const match = isBuild ? `data:image/png;base64` : `/foo/bar/nested/icon.png`
    expect(await getBg('.css-url-base64-inline')).toMatch(match)
    expect(await getBg('.css-url-quotes-base64-inline')).toMatch(match)
  })

  test('no base64 inline for icon and manifest links', async () => {
    const iconEl = await page.$(`link.ico`)
    const href = await iconEl.getAttribute('href')
    expect(href).toMatch(
      isBuild ? /\/foo\/bar\/assets\/favicon-[-\w]{8}\.ico/ : 'favicon.ico',
    )

    const manifestEl = await page.$(`link[rel="manifest"]`)
    const manifestHref = await manifestEl.getAttribute('href')
    expect(manifestHref).toMatch(
      isBuild ? /\/foo\/bar\/assets\/manifest-[-\w]{8}\.json/ : 'manifest.json',
    )
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

  test('url() with svg', async () => {
    expect(await getBg('.css-url-svg')).toMatch(
      isBuild ? /data:image\/svg\+xml,.+/ : '/foo/bar/nested/fragment-bg.svg',
    )
  })

  test('image-set() with svg', async () => {
    expect(await getBg('.css-image-set-svg')).toMatch(
      isBuild ? /data:image\/svg\+xml,.+/ : '/foo/bar/nested/fragment-bg.svg',
    )
  })
})

describe('image', () => {
  test('srcset', async () => {
    const img = await page.$('.img-src-set')
    const srcset = await img.getAttribute('srcset')
    srcset.split(', ').forEach((s) => {
      expect(s).toMatch(
        isBuild
          ? /\/foo\/bar\/assets\/asset-[-\w]{8}\.png \dx/
          : /\/foo\/bar\/nested\/asset.png \dx/,
      )
    })
  })

  test('srcset (public)', async () => {
    const img = await page.$('.img-src-set-public')
    const srcset = await img.getAttribute('srcset')
    srcset.split(', ').forEach((s) => {
      expect(s).toMatch(/\/foo\/bar\/icon\.png \dx/)
    })
  })

  test('srcset (mixed)', async () => {
    const img = await page.$('.img-src-set-mixed')
    const srcset = await img.getAttribute('srcset')
    const srcs = srcset.split(', ')
    expect(srcs[1]).toMatch(
      isBuild
        ? /\/foo\/bar\/assets\/asset-[-\w]{8}\.png \dx/
        : /\/foo\/bar\/nested\/asset.png \dx/,
    )
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
    expect(await img.getAttribute('src')).toMatch(
      isBuild
        ? // Assert trimmed (data URI starts with < and ends with >)
          /^data:image\/svg\+xml,%3c.*%3e#icon-heart-view$/
        : /svg#icon-heart-view$/,
    )
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
      : `/foo/bar/foo.js`,
  )
})

test('?url import on css', async () => {
  const src = readFile('css/icons.css')
  const txt = await page.textContent('.url-css')
  expect(txt).toEqual(
    isBuild
      ? `data:text/css;base64,${Buffer.from(src).toString('base64')}`
      : '/foo/bar/css/icons.css',
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
        : `/foo/bar/テスト-測試-white space.js`,
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

test('new URL(..., import.meta.url) without extension', async () => {
  expect(await page.textContent('.import-meta-url-without-extension')).toMatch(
    isBuild ? 'data:application/javascript' : 'nested/test.js',
  )
  expect(
    await page.textContent('.import-meta-url-content-without-extension'),
  ).toContain('export default class')
})

test('new URL(`${dynamic}`, import.meta.url)', async () => {
  expect(await page.textContent('.dynamic-import-meta-url-1')).toMatch(
    isBuild ? 'data:image/png;base64' : '/foo/bar/nested/icon.png',
  )
  expect(await page.textContent('.dynamic-import-meta-url-2')).toMatch(
    assetMatch,
  )
  expect(await page.textContent('.dynamic-import-meta-url-js')).toMatch(
    isBuild ? 'data:application/javascript;base64' : '/foo/bar/nested/test.js',
  )
})

test('new URL(`./${dynamic}?abc`, import.meta.url)', async () => {
  expect(await page.textContent('.dynamic-import-meta-url-1-query')).toMatch(
    isBuild ? 'data:image/png;base64' : '/foo/bar/nested/icon.png?abc',
  )
  expect(await page.textContent('.dynamic-import-meta-url-2-query')).toMatch(
    isBuild
      ? /\/foo\/bar\/assets\/asset-[-\w]{8}\.png\?abc/
      : '/foo/bar/nested/asset.png?abc',
  )
})

test('new URL(`./${1 === 0 ? static : dynamic}?abc`, import.meta.url)', async () => {
  expect(await page.textContent('.dynamic-import-meta-url-1-ternary')).toMatch(
    isBuild ? 'data:image/png;base64' : '/foo/bar/nested/icon.png?abc',
  )
  expect(await page.textContent('.dynamic-import-meta-url-2-ternary')).toMatch(
    isBuild
      ? /\/foo\/bar\/assets\/asset-[-\w]{8}\.png\?abc/
      : '/foo/bar/nested/asset.png?abc',
  )
})

test('new URL(`non-existent`, import.meta.url)', async () => {
  // the inlined script tag is extracted in a separate file
  const importMetaUrl = new URL(
    isBuild ? '/foo/bar/assets/index.js' : '/foo/bar/index.html',
    page.url(),
  )
  expect(await page.textContent('.non-existent-import-meta-url')).toMatch(
    new URL('non-existent', importMetaUrl).pathname,
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
    const cssFile = findAssetFile(/index-[-\w]+\.css$/, 'foo')
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
    const loadPromise = page.waitForEvent('load')
    editFile(
      './css/import.css',
      (code) => code.replace('#0088ff', '#00ff88'),
      true,
    )
    await loadPromise
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

test('url() contains file in publicDir, as inline style', async () => {
  expect(await getBg('.inline-style-public')).toContain(iconMatch)
})

test('should not rewrite non-relative urls in html', async () => {
  const link = page.locator('.data-href')
  expect(await link.getAttribute('href')).toBe('data:,')
})

test.runIf(isBuild)('assets inside <noscript> is rewrote', async () => {
  const indexHtml = readFile('./dist/foo/index.html')
  expect(indexHtml).toMatch(
    /<img class="noscript" src="\/foo\/bar\/assets\/asset-[-\w]+\.png" \/>/,
  )
})
