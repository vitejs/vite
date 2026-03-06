import { describe, expect, test } from 'vitest'
import { isServe, page, viteTestUrl } from '~utils'

describe.runIf(isServe)('main', () => {
  for (const { name, urlPath } of [
    { name: 'src/deny/deny.txt', urlPath: '/src/deny/deny.txt' },
    { name: 'src/deny/.deny', urlPath: '/src/deny/.deny' },
  ]) {
    test(`**/deny/** should deny ${name}`, async () => {
      const res = await page.request.fetch(new URL(urlPath, viteTestUrl).href)
      expect(res.status()).toBe(403)
    })
  }
})
