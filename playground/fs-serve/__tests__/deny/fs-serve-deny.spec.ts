import { describe, expect, test } from 'vitest'
import { isServe, page, viteTestUrl } from '~utils'

describe.runIf(isServe)('main', () => {
  test('**/deny/** should deny src/deny/deny.txt', async () => {
    const res = await page.request.fetch(
      new URL('/src/deny/deny.txt', viteTestUrl).href,
    )
    expect(res.status()).toBe(403)
  })
  test('**/deny/** should deny src/deny/.deny', async () => {
    const res = await page.request.fetch(
      new URL('/src/deny/.deny', viteTestUrl).href,
    )
    expect(res.status()).toBe(403)
  })
})
