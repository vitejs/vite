import { describe, expect, test } from 'vitest'
import { browserLogs, isBuild, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe.runIf(isBuild)('build', () => {
  test('dynamic import', async () => {
    await page.waitForSelector('#done')
    expect(await page.textContent('#done')).toBe('ran js')
  })

  test('dynamic import with comments', async () => {
    await page.click('#hello .load')
    await page.waitForSelector('#hello output')

    const html = await page.content()
    expect(html).toMatch(
      /link rel="modulepreload".*?href=".*?\/assets\/hello-[-\w]{8}\.js"/,
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href=".*?\/assets\/hello-[-\w]{8}\.css"/,
    )
  })

  test('does not re-preload a chunk already preloaded by the HTML', async () => {
    const chunkPreloads = () =>
      page.$$eval('link[rel="modulepreload"]', (links) =>
        links
          .map((l) => (l as HTMLLinkElement).href)
          .filter((href) => /\/assets\/chunk-[-\w]{8}\.js$/.test(href)),
      )
    expect(await chunkPreloads()).toHaveLength(1)

    await page.click('#about .load')
    await page.waitForSelector('#about output')
    expect(await chunkPreloads()).toHaveLength(1)
  })
})
