import fs from 'fs'
import path from 'path'
import {
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  testDir
} from '../../testUtils'

const assetMatch = isBuild
  ? /\/foo\/assets\/asset\.\w{8}\.png/
  : '/foo/nested/asset.png'

const iconMatch = `/foo/icon.png`

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe('injected scripts', () => {
  test('@vite/client', async () => {
    const hasClient = await page.$(
      'script[type="module"][src="/foo/@vite/client"]'
    )
    if (isBuild) {
      expect(hasClient).toBeFalsy()
    } else {
      expect(hasClient).toBeTruthy()
    }
  })

  test('html-proxy', async () => {
    const hasHtmlProxy = await page.$(
      'script[type="module"][src="/foo/index.html?html-proxy&index=0.js"]'
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
      })
    ).toBe(true)
  })

  test('relative', async () => {
    expect(await getBg('.css-url-relative')).toMatch(assetMatch)
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
    const match = isBuild ? `data:image/png;base64` : `/foo/nested/icon.png`
    expect(await getBg('.css-url-base64-inline')).toMatch(match)
    expect(await getBg('.css-url-quotes-base64-inline')).toMatch(match)
  })

  if (isBuild) {
    test('preserve postfix query/hash', () => {
      expect(findAssetFile(/\.css$/, 'foo')).toMatch(`woff2?#iefix`)
    })
  }
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
