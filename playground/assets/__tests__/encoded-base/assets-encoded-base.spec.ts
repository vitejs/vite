import { beforeAll, describe, expect, test } from 'vitest'
import {
  browserLogs,
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  page,
} from '~utils'

const urlAssetMatch = isBuild
  ? /\/foo%20bar\/other-assets\/asset-[-\w]{8}\.png/
  : '/nested/asset.png'

const iconMatch = '/icon.png'

const absoluteIconMatch = isBuild
  ? /\/foo%20bar\/.*\/icon-[-\w]{8}\.png/
  : '/nested/icon.png'

const absolutePublicIconMatch = isBuild ? /\/foo%20bar\/icon\.png/ : '/icon.png'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
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
    expect(await page.textContent('.asset-import-relative')).toMatch(
      urlAssetMatch,
    )
  })

  test('absolute', async () => {
    expect(await page.textContent('.asset-import-absolute')).toMatch(
      urlAssetMatch,
    )
  })

  test('from /public', async () => {
    expect(await page.textContent('.public-import')).toMatch(
      absolutePublicIconMatch,
    )
  })
})

describe('css url() references', () => {
  test('fonts', async () => {
    expect(
      await page.evaluate(() => document.fonts.check('700 32px Inter')),
    ).toBe(true)
  })

  test('relative', async () => {
    const bg = await getBg('.css-url-relative')
    expect(bg).toMatch(urlAssetMatch)
  })

  test('image-set relative', async () => {
    const imageSet = await getBg('.css-image-set-relative')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(urlAssetMatch)
    })
  })

  test('image-set without the url() call', async () => {
    const imageSet = await getBg('.css-image-set-without-url-call')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(urlAssetMatch)
    })
  })

  test('image-set with var', async () => {
    const imageSet = await getBg('.css-image-set-with-var')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(urlAssetMatch)
    })
  })

  test('image-set with mix', async () => {
    const imageSet = await getBg('.css-image-set-mix-url-var')
    imageSet.split(', ').forEach((s) => {
      expect(s).toMatch(urlAssetMatch)
    })
  })

  test('relative in @import', async () => {
    expect(await getBg('.css-url-relative-at-imported')).toMatch(urlAssetMatch)
  })

  test('absolute', async () => {
    expect(await getBg('.css-url-absolute')).toMatch(urlAssetMatch)
  })

  test('from /public', async () => {
    expect(await getBg('.css-url-public')).toMatch(iconMatch)
  })

  test('multiple urls on the same line', async () => {
    const bg = await getBg('.css-url-same-line')
    expect(bg).toMatch(urlAssetMatch)
    expect(bg).toMatch(iconMatch)
  })

  test('aliased', async () => {
    const bg = await getBg('.css-url-aliased')
    expect(bg).toMatch(urlAssetMatch)
  })
})

describe.runIf(isBuild)('index.css URLs', () => {
  let css: string
  beforeAll(() => {
    css = findAssetFile(/index.*\.css$/, 'encoded-base', 'other-assets')
  })

  test('use base URL for asset URL', () => {
    expect(css).toMatch(urlAssetMatch)
  })

  test('preserve postfix query/hash', () => {
    expect(css).toMatch('woff2?#iefix')
  })
})

describe('image', () => {
  test('srcset', async () => {
    const img = await page.$('.img-src-set')
    const srcset = await img.getAttribute('srcset')
    srcset.split(', ').forEach((s) => {
      expect(s).toMatch(
        isBuild
          ? /\/foo%20bar\/other-assets\/asset-[-\w]{8}\.png \dx/
          : /\/foo%20bar\/nested\/asset\.png \dx/,
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
    const bg = await page.evaluate(
      () => getComputedStyle(document.querySelector('.icon')).backgroundImage,
    )
    expect(bg).toMatch(/svg#icon-clock-view"\)$/)
  })

  test('from js import', async () => {
    const img = await page.$('.svg-frag-import')
    expect(await img.getAttribute('src')).toMatch(/svg#icon-heart-view$/)
  })
})

test('?raw import', async () => {
  expect(await page.textContent('.raw')).toMatch('SVG')
})

test('?url import', async () => {
  expect(await page.textContent('.url')).toMatch(
    isBuild ? /\/foo%20bar\/other-assets\/foo-[-\w]{8}\.js/ : '/foo.js',
  )
})

test('?url import on css', async () => {
  const txt = await page.textContent('.url-css')
  expect(txt).toMatch(
    isBuild
      ? /\/foo%20bar\/other-assets\/icons-[-\w]{8}\.css/
      : '/css/icons.css',
  )
})

test('new URL(..., import.meta.url)', async () => {
  expect(await page.textContent('.import-meta-url')).toMatch(urlAssetMatch)
})

test('new URL(`${dynamic}`, import.meta.url)', async () => {
  const dynamic1 = await page.textContent('.dynamic-import-meta-url-1')
  expect(dynamic1).toMatch(absoluteIconMatch)
  const dynamic2 = await page.textContent('.dynamic-import-meta-url-2')
  expect(dynamic2).toMatch(urlAssetMatch)
})

test('new URL(`non-existent`, import.meta.url)', async () => {
  expect(await page.textContent('.non-existent-import-meta-url')).toMatch(
    '/non-existent',
  )
})

test('inline style test', async () => {
  expect(await getBg('.inline-style')).toMatch(urlAssetMatch)
  expect(await getBg('.style-url-assets')).toMatch(urlAssetMatch)
})

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
