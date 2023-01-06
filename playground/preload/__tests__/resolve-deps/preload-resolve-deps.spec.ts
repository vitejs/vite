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
      /link rel="modulepreload".*?href="http.*?\/hello-\w{8}\.js"/,
    )
    expect(html).toMatch(/link rel="modulepreload".*?href="\/preloaded.js"/)
    expect(html).toMatch(
      /link rel="stylesheet".*?href="http.*?\/hello-\w{8}\.css"/,
    )
  })
})
