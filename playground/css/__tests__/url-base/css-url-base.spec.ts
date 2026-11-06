import { expect, test } from 'vitest'
import { bundledDevTodo, getBg, isBundled, page } from '~utils'

async function getImageWidths(selector: string) {
  const background = await getBg(selector)
  const urls = [...background.matchAll(/url\("([^"]+)"\)/g)].map(
    (match) => match[1],
  )
  const widths = await page.evaluate(
    (urls) =>
      Promise.all(
        urls.map(
          (url) =>
            new Promise<number>((resolve, reject) => {
              const image = new Image()
              image.onload = () => resolve(image.naturalWidth)
              image.onerror = reject
              image.src = url
            }),
        ),
      ),
    urls,
  )
  return { urls, widths }
}

test('local values preserve distinct URLs that collide after rewriting', async () => {
  await page.waitForSelector('.local[class*="entry"]')
  const { urls, widths } = await getImageWidths('.local')
  expect(widths).toEqual([12, 24])
  expect(urls[0]).not.toBe(urls[1])
  if (!isBundled) {
    expect(new URL(urls[0]).pathname).toBe('/probe/values/image.svg')
    expect(new URL(urls[1]).pathname).toBe('/probe/probe/values/image.svg')
  }
})

test('imported values retain the defining file URL with a custom base', async () => {
  await page.waitForSelector('.imported[class*="entry"]')
  const { urls, widths } = await getImageWidths('.imported')
  expect(widths).toEqual([12])
  if (!isBundled) {
    expect(new URL(urls[0]).pathname).toBe('/probe/values/image.svg')
  }
  const exported = await page.textContent('.exported')
  expect(exported).not.toContain('__VITE_CSS_MODULE_URL_')
  expect(exported).toContain(new URL(urls[0]).pathname)
})

for (const [prefix, names] of [
  ['local-function', ['pathUrl', 'pathSet', 'urlSet', 'combined']],
  ['imported-function', ['pathUrl', 'pathSet', 'urlSet']],
] as const) {
  test.each(names)(
    `${prefix} expands %s before resolving its URL`,
    async (name) => {
      const selector = `.${prefix}-${name}`
      await page.waitForSelector(selector)
      const { urls, widths } = await getImageWidths(selector)
      expect(widths).toEqual([12])
      if (!isBundled) {
        expect(new URL(urls[0]).pathname).toBe('/probe/values/image.svg')
      }
    },
  )
}

test('composed modules expand value names inside URL functions and image sets', async () => {
  await page.waitForSelector('.composed-functions')
  const { urls, widths } = await getImageWidths('.composed-functions')
  expect(widths).toEqual([12, 12, 12])
  if (!isBundled) {
    expect(urls.map((url) => new URL(url).pathname)).toEqual([
      '/probe/values/image.svg',
      '/probe/values/image.svg',
      '/probe/values/image.svg',
    ])
  }
  const exported = await page.textContent('.function-exports')
  expect(exported).not.toMatch(/__VITE_CSS_MODULE_URL_|imagePath/)
  expect(exported).toContain(new URL(urls[0]).pathname)
})

for (const prefix of ['local-embedded', 'imported-embedded']) {
  for (const name of [
    'quotedPath',
    'unquotedPath',
    'stringSetPath',
    'urlSetPath',
    'quotedFragment',
    'unquotedFragment',
    'stringSetFragment',
    'urlSetFragment',
  ]) {
    test(
      `${prefix} substitutes identifiers in ${name}`,
      name.endsWith('Fragment')
        ? bundledDevTodo('Bundled dev drops asset URL fragments.')
        : {},
      async () => {
        const selector = `.${prefix}-${name}`
        await page.waitForSelector(selector)
        const { urls, widths } = await getImageWidths(selector)
        expect(widths).toEqual([12])
        expect(new URL(urls[0]).hash).toBe(
          name.endsWith('Fragment') ? '#icon' : '',
        )
        if (!isBundled) {
          expect(new URL(urls[0]).pathname).toBe('/probe/values/image.svg')
        }
      },
    )
  }
}
