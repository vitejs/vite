import type { Response } from 'playwright-chromium'
import { describe, expect, test } from 'vitest'
import { isBundledDev, page } from '~utils'

describe.runIf(isBundledDev)('lazy compilation with a non-root base', () => {
  test('lazy imports are requested under base', async () => {
    const lazyResponses: Response[] = []
    const onResponse = (res: Response) => {
      if (res.url().includes('/@vite/lazy?')) lazyResponses.push(res)
    }
    page.on('response', onResponse)

    try {
      // A lazy import from the initial chunk
      await page.click('#route-a-btn')
      await expect
        .poll(() => page.textContent('#route-a-content'))
        .toBe('A:shared-value')

      // A lazy import from inside a lazy chunk
      await page.click('#route-nested-btn')
      await expect
        .poll(() => page.textContent('#route-nested-content'))
        .toBe('nested-inner')
    } finally {
      page.off('response', onResponse)
    }

    expect(lazyResponses.length).toBeGreaterThanOrEqual(3)
    for (const res of lazyResponses) {
      expect(new URL(res.url()).pathname).toBe('/foo/@vite/lazy')
      expect(res.status()).toBe(200)
    }
  })
})
