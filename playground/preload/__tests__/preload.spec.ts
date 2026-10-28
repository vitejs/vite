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

  test('removes load/error listeners once the preload link settles', async () => {
    // Re-navigate with the spy installed so the in-memory preload cache is
    // fresh and we observe the very first preload of this chunk.
    await page.addInitScript(() => {
      let added = 0
      let removed = 0
      const sync = () => {
        document.documentElement.dataset.linkListeners = `${added},${removed}`
      }
      const { addEventListener, removeEventListener } = EventTarget.prototype
      EventTarget.prototype.addEventListener = function (
        type,
        listener,
        options,
      ) {
        if (
          this instanceof HTMLLinkElement &&
          this.rel === 'stylesheet' &&
          (type === 'load' || type === 'error')
        ) {
          added++
          sync()
        }
        return addEventListener.call(this, type, listener, options)
      }
      EventTarget.prototype.removeEventListener = function (
        type,
        listener,
        options,
      ) {
        if (
          this instanceof HTMLLinkElement &&
          this.rel === 'stylesheet' &&
          (type === 'load' || type === 'error')
        ) {
          removed++
          sync()
        }
        return removeEventListener.call(this, type, listener, options)
      }
    })
    await page.reload()
    await page.waitForSelector('#done')

    await page.click('#hello .load')
    await page.waitForSelector('#hello output')

    const stats = await page.evaluate(() => {
      const [added = 0, removed = 0] = (
        document.documentElement.dataset.linkListeners ?? ''
      )
        .split(',')
        .map(Number)
      return { added, removed }
    })
    // one `load` + one `error` listener are registered on the stylesheet link
    expect(stats.added).toBeGreaterThanOrEqual(2)
    // ... and both must be gone once the link settles, otherwise the retained
    // listener keeps the whole preload closure alive for the page's lifetime
    expect(stats.added - stats.removed).toBe(0)
  })
})
