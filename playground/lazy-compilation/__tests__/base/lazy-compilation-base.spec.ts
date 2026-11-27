import type { Response } from 'playwright-chromium'
import { describe, expect, onTestFinished, test } from 'vitest'
import { isBundledDev, lazyTargetsOf, page } from '~utils'

// Regression test for https://github.com/vitejs/vite/issues/23216

describe.runIf(isBundledDev)('lazy compilation with a non-root base', () => {
  test('lazy imports are requested under base', async () => {
    const lazyResponses: { res: Response; ids: Promise<string[]> }[] = []
    const onResponse = (res: Response) => {
      if (res.url().includes('/__rolldown_hmr_patch.js?')) {
        lazyResponses.push({ res, ids: lazyTargetsOf(res.url()) })
      }
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

    const lazyIds = (
      await Promise.all(lazyResponses.map(({ ids }) => ids))
    ).flat()
    for (const file of [
      'page-a.js',
      'page-nested.js',
      'page-nested-inner.js',
    ]) {
      expect(
        lazyIds.some((id) => id.endsWith(file)),
        file,
      ).toBe(true)
    }
    for (const { res } of lazyResponses) {
      expect(new URL(res.url()).pathname).toBe('/foo/__rolldown_hmr_patch.js')
      expect(res.status()).toBe(200)
    }
  })

  test('a query sent in a POST body is posted under base', async () => {
    const posts: string[] = []
    const postedQueries: string[] = []
    const pullUrls: string[] = []
    const onResponse = (res: Response) => {
      const url = new URL(res.url())
      if (res.request().method() === 'POST') {
        posts.push(`${res.status()} ${url.pathname}`)
        postedQueries.push(res.request().postData() ?? '')
      } else if (url.pathname === '/foo/__rolldown_hmr_patch.js') {
        pullUrls.push(url.search)
      }
    }
    page.on('response', onResponse)
    // every query is longer than 0 characters, so every request posts first
    const maxQueryLength = await page.evaluate(() => {
      const runtime = (globalThis as any).__rolldown_runtime__
      const old = runtime.maxQueryLength
      runtime.maxQueryLength = 0
      return old
    })
    onTestFinished(async () => {
      page.off('response', onResponse)
      await page.evaluate((old) => {
        ;(globalThis as any).__rolldown_runtime__.maxQueryLength = old
      }, maxQueryLength)
    })

    await page.click('#route-b-btn')
    await expect
      .poll(() => page.textContent('#route-b-content'))
      .toBe('B:shared-value')
    expect(posts).toStrictEqual(['200 /foo/__rolldown_hmr_have'])
    // absolute, so a page on another origin (`server.origin`) still posts to Vite
    expect(
      await page.evaluate(() =>
        (globalThis as any).__rolldown_runtime__.haveUrl(),
      ),
    ).toBe(new URL('/foo/__rolldown_hmr_have', page.url()).href)
    expect(pullUrls).toStrictEqual([
      expect.stringMatching(/^\?t=[\w-]+&n=\d+$/),
    ])
    // the posted query names the route by its number
    expect(await lazyTargetsOf(postedQueries[0])).toStrictEqual([
      expect.stringMatching(/page-b\.js$/),
    ])
  })
})
