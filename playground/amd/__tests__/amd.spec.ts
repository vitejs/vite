import { describe, expect, test } from 'vitest'
import { browserLogs, getBg, isBuild, page } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('should have no 404s', async () => {
    await page.waitForLoadState('networkidle')
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  test('asset url is correct with `base: "."`', async () => {
    await expect
      .poll(() => getBg('.assets'))
      .toMatch(/\/assets\/asset-[-\w]{8}\.png/)
  })
})
