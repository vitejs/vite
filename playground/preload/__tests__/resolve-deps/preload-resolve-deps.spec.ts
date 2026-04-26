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
      /link rel="modulepreload".*?href="http.*?\/hello-[-\w]{8}\.js"/,
    )
    expect(html).toMatch(
      /link rel="modulepreload".*?href="http.*?\/preloaded.js"/,
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href="http.*?\/hello-[-\w]{8}\.css"/,
    )

    const knownModulePreload = await page
      .locator('link[rel="modulepreload"][href*="/hello-"]')
      .evaluate((link: HTMLLinkElement) => ({
        crossorigin: link.getAttribute('crossorigin'),
        integrity: link.integrity,
      }))
    expect(knownModulePreload.crossorigin).toBe('')
    expect(knownModulePreload.integrity).toMatch(/^sha384-/)

    const customModulePreload = await page
      .locator('link[rel="modulepreload"][href*="/preloaded.js"]')
      .evaluate((link: HTMLLinkElement) => ({
        crossorigin: link.getAttribute('crossorigin'),
        integrity: link.getAttribute('integrity'),
      }))
    expect(customModulePreload.crossorigin).toBe('')
    expect(customModulePreload.integrity).toBeNull()

    const stylesheetIntegrity = await page
      .locator('link[rel="stylesheet"][href*="/hello-"]')
      .evaluate((link: HTMLLinkElement) => ({
        crossorigin: link.getAttribute('crossorigin'),
        integrity: link.integrity,
      }))
    expect(stylesheetIntegrity.crossorigin).toBe('')
    expect(stylesheetIntegrity.integrity).toMatch(/^sha384-/)
  })
})
