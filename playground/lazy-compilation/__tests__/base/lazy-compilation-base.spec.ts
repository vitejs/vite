import type { Response } from 'playwright-chromium'
import { describe, expect, onTestFinished, test } from 'vitest'
import { isBundledDev, page } from '~utils'

// Regression test for https://github.com/vitejs/vite/issues/23216

const lazyIdOf = (url: string) => new URL(url).searchParams.get('id') ?? ''

describe.runIf(isBundledDev)('lazy compilation with a non-root base', () => {
  test('lazy imports are requested under base', async () => {
    const lazyResponses: Response[] = []
    const onResponse = (res: Response) => {
      if (res.url().includes('/@vite/lazy?')) lazyResponses.push(res)
    }
    page.on('response', onResponse)
    onTestFinished(() => {
      page.off('response', onResponse)
    })

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

    for (const file of [
      'page-a.js',
      'page-nested.js',
      'page-nested-inner.js',
    ]) {
      expect(
        lazyResponses.some((res) => lazyIdOf(res.url()).includes(file)),
        file,
      ).toBe(true)
    }
    for (const res of lazyResponses) {
      expect(new URL(res.url()).pathname).toBe('/foo/@vite/lazy')
      expect(res.status()).toBe(200)
    }
  })
})
