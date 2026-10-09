import { describe, expect, test } from 'vitest'
import { browserLogs, getColor, isBuild, page } from '~utils'

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

  test('retries a stylesheet preload in place after it fails', async () => {
    let requestCount = 0
    await page.route(/\/assets\/hello-.*\.css$/, async (route) => {
      requestCount++
      if (requestCount === 1) {
        await route.abort()
      } else {
        await route.continue()
      }
    })
    await page.evaluate(() => {
      window.addEventListener(
        'vite:preloadError',
        () => {
          document.documentElement.dataset.preloadError = 'true'
        },
        { once: true },
      )
    })

    await page.click('#hello .load')
    await page.waitForFunction(
      () => document.documentElement.dataset.preloadError === 'true',
    )

    const stylesheetSelector = 'link[rel="stylesheet"][href*="/assets/hello-"]'
    expect(await page.locator(stylesheetSelector).count()).toBe(1)
    await page.locator(stylesheetSelector).evaluate((failedLink) => {
      const marker = document.createElement('meta')
      marker.id = 'css-precedence-marker'
      failedLink.after(marker)
    })

    await page.click('#hello .load')
    await page.waitForSelector('#hello output')

    expect(requestCount).toBe(2)
    expect(await getColor('#hello .msg')).toBe('red')
    // make sure the link tag exists in the same place
    // so that the precedence of the CSS link is maintained
    expect(
      await page
        .locator(stylesheetSelector)
        .evaluate(
          (link) => link.nextElementSibling?.id === 'css-precedence-marker',
        ),
    ).toBe(true)
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
