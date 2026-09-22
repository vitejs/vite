import { describe, expect, test } from 'vitest'
import { isBundledDev, isServe, page, viteTestUrl } from '~utils'

describe.runIf(isServe)('main', () => {
  for (const { name, urlPath } of [
    { name: 'src/deny/deny.txt', urlPath: '/src/deny/deny.txt' },
    { name: 'src/deny/.deny', urlPath: '/src/deny/.deny' },
    { name: 'src/deny/deny.txt?raw', urlPath: '/src/deny/deny.txt?raw' },
    { name: 'src/deny/deny.txt?url', urlPath: '/src/deny/deny.txt?url' },
    {
      name: 'src/deny/deny.txt?import&raw',
      urlPath: '/src/deny/deny.txt?import&raw',
    },
    {
      name: 'src/deny/.deny?.svg?import',
      urlPath: '/src/deny/.deny?.svg?import',
    },
  ]) {
    test(`**/deny/** should deny ${name}`, async () => {
      const res = await page.request.fetch(new URL(urlPath, viteTestUrl).href)
      // bundled dev never serves a project file, so the request is a 404
      // before any deny rule is consulted
      expect(res.status()).toBe(isBundledDev ? 404 : 403)
    })
  }
})
