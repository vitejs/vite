import {
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  listAssets,
  readManifest,
  readFile,
  editFile,
  notifyRebuildComplete,
  mochaReset,
  mochaSetup
} from '../../testUtils'

const assetMatch = isBuild
  ? /\/foo\/assets\/asset\.\w{8}\.png/
  : '/foo/nested/asset.png'

const iconMatch = `/foo/icon.png`

describe('assets.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should have no 404s', () => {
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  describe('injected scripts', () => {
    it('@vite/client', async () => {
      const hasClient = await page.$(
        'script[type="module"][src="/foo/@vite/client"]'
      )
      if (isBuild) {
        expect(hasClient).toBeFalsy()
      } else {
        expect(hasClient).toBeTruthy()
      }
    })

    it('html-proxy', async () => {
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
    it('load raw js from /public', async () => {
      expect(await page.textContent('.raw-js')).toMatch('[success]')
    })

    it('load raw css from /public', async () => {
      expect(await getColor('.raw-css')).toBe('red')
    })
  })

  describe('asset imports from js', () => {
    it('relative', async () => {
      expect(await page.textContent('.asset-import-relative')).toMatch(
        assetMatch
      )
    })

    it('absolute', async () => {
      expect(await page.textContent('.asset-import-absolute')).toMatch(
        assetMatch
      )
    })

    it('from /public', async () => {
      expect(await page.textContent('.public-import')).toMatch(iconMatch)
    })
  })

  describe('css url() references', () => {
    it('fonts', async () => {
      expect(
        await page.evaluate(() => {
          return (document as any).fonts.check('700 32px Inter')
        })
      ).toBe(true)
    })

    it('relative', async () => {
      expect(await getBg('.css-url-relative')).toMatch(assetMatch)
    })

    it('image-set relative', async () => {
      const imageSet = await getBg('.css-image-set-relative')
      imageSet.split(', ').forEach((s) => {
        expect(s).toMatch(assetMatch)
      })
    })

    it('image-set without the url() call', async () => {
      const imageSet = await getBg('.css-image-set-without-url-call')
      imageSet.split(', ').forEach((s) => {
        expect(s).toMatch(assetMatch)
      })
    })

    it('relative in @import', async () => {
      expect(await getBg('.css-url-relative-at-imported')).toMatch(assetMatch)
    })

    it('absolute', async () => {
      expect(await getBg('.css-url-absolute')).toMatch(assetMatch)
    })

    it('from /public', async () => {
      expect(await getBg('.css-url-public')).toMatch(iconMatch)
    })

    it('base64 inline', async () => {
      const match = isBuild ? `data:image/png;base64` : `/foo/nested/icon.png`
      expect(await getBg('.css-url-base64-inline')).toMatch(match)
      expect(await getBg('.css-url-quotes-base64-inline')).toMatch(match)
    })

    it('multiple urls on the same line', async () => {
      const bg = await getBg('.css-url-same-line')
      expect(bg).toMatch(assetMatch)
      expect(bg).toMatch(iconMatch)
    })

    it('aliased', async () => {
      const bg = await getBg('.css-url-aliased')
      expect(bg).toMatch(assetMatch)
    })

    if (isBuild) {
      it('preserve postfix query/hash', () => {
        expect(findAssetFile(/\.css$/, 'foo')).toMatch(`woff2?#iefix`)
      })
    }
  })

  describe('image', () => {
    it('srcset', async () => {
      const img = await page.$('.img-src-set')
      const srcset = await img.getAttribute('srcset')
      srcset.split(', ').forEach((s) => {
        expect(s).toMatch(
          isBuild
            ? /\/foo\/assets\/asset\.\w{8}\.png \d{1}x/
            : /\.\/nested\/asset\.png \d{1}x/
        )
      })
    })
  })

  describe('svg fragments', () => {
    // 404 is checked already, so here we just ensure the urls end with #fragment
    it('img url', async () => {
      const img = await page.$('.svg-frag-img')
      expect(await img.getAttribute('src')).toMatch(/svg#icon-clock-view$/)
    })

    it('via css url()', async () => {
      const bg = await page.evaluate(() => {
        return getComputedStyle(document.querySelector('.icon')).backgroundImage
      })
      expect(bg).toMatch(/svg#icon-clock-view"\)$/)
    })

    it('from js import', async () => {
      const img = await page.$('.svg-frag-import')
      expect(await img.getAttribute('src')).toMatch(/svg#icon-heart-view$/)
    })
  })

  it('?raw import', async () => {
    expect(await page.textContent('.raw')).toMatch('SVG')
  })

  it('?url import', async () => {
    const src = readFile('foo.js')
    expect(await page.textContent('.url')).toMatch(
      isBuild
        ? `data:application/javascript;base64,${Buffer.from(src).toString(
            'base64'
          )}`
        : `/foo/foo.js`
    )
  })

  describe('unicode url', () => {
    it('from js import', async () => {
      const src = readFile('テスト-測試-white space.js')
      expect(await page.textContent('.unicode-url')).toMatch(
        isBuild
          ? `data:application/javascript;base64,${Buffer.from(src).toString(
              'base64'
            )}`
          : `/foo/テスト-測試-white space.js`
      )
    })
  })

  it('new URL(..., import.meta.url)', async () => {
    expect(await page.textContent('.import-meta-url')).toMatch(assetMatch)
  })

  it('new URL(`${dynamic}`, import.meta.url)', async () => {
    expect(await page.textContent('.dynamic-import-meta-url-1')).toMatch(
      isBuild ? 'data:image/png;base64' : '/foo/nested/icon.png'
    )
    expect(await page.textContent('.dynamic-import-meta-url-2')).toMatch(
      assetMatch
    )
  })

  if (isBuild) {
    it('manifest', async () => {
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
  }
  describe('css and assets in css in build watch', () => {
    if (isBuild) {
      it('css will not be lost and css does not contain undefined', async () => {
        editFile('index.html', (code) => code.replace('Assets', 'assets'), true)
        await notifyRebuildComplete(watcher)
        const cssFile = findAssetFile(/index\.\w+\.css$/, 'foo')
        expect(cssFile).not.toBe('')
        expect(cssFile).not.toMatch(/undefined/)
        watcher?.close()
      })
    }
  })
})
