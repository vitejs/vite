import { isBuild } from '../../../testUtils'

describe('main', () => {
  if (!isBuild) {
    test('**/deny/** should deny src/deny/deny.txt', async () => {
      const res = await page.request.fetch(
        new URL('/src/deny/deny.txt', viteTestUrl).href
      )
      expect(res.status()).toBe(403)
    })
    test('**/deny/** should deny src/deny/.deny', async () => {
      const res = await page.request.fetch(
        new URL('/src/deny/.deny', viteTestUrl).href
      )
      expect(res.status()).toBe(403)
    })
  } else {
    test('dummy test to make jest happy', async () => {
      // Your test suite must contain at least one test.
    })
  }
})
