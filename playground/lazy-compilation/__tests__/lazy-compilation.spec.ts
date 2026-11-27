import type { Response, Route } from 'playwright-chromium'
import { beforeAll, describe, expect, test } from 'vitest'
import { isBundledDev, lazyTargetsOf, page, promiseWithResolvers } from '~utils'

// Regression test for rolldown/rolldown#10774.
//
// A lazy chunk omits every factory the client already holds. The client lists
// them in the request itself, so a response that left the server but did not
// reach the page yet cannot make a later chunk omit a factory. If it did, the
// later chunk would omit a shared factory and `initModule` would throw
// `MissingFactoryError` in the browser.
//
// The spec makes that window deterministic with Playwright routing: A's
// response is fetched from the server (so the server finished writing it) but
// held back from the page until B has been requested and evaluated.
//
// Both tests share one page session on purpose: the second test continues from
// the state the first test leaves behind, a page that ran A and B.

const factoryFor = (file: string) =>
  new RegExp(`registerFactory\\("[^"]*/${file}"`)

const lazyBodies: { ids: string[]; body: Promise<string> }[] = []
const findLazyBody = (route: string) =>
  lazyBodies.find((e) => e.ids.some((id) => id.includes(route)))
const lazyBody = async (route: string) => {
  // the listener maps the numbers of a response after it arrived
  await expect.poll(() => findLazyBody(route) !== undefined).toBe(true)
  return findLazyBody(route)!.body
}

const onResponse = async (res: Response) => {
  if (res.url().includes('/__rolldown_hmr_patch.js?')) {
    const body = res.text()
    const ids = await lazyTargetsOf(res.url())
    if (ids.length > 0) lazyBodies.push({ ids, body })
  }
}

describe.runIf(isBundledDev)('lazy compilation', () => {
  beforeAll(() => {
    page.on('response', onResponse)
    return () => {
      page.off('response', onResponse)
    }
  })

  test('a chunk compiled while an earlier chunk is still in flight carries the shared factory', async () => {
    // Resolved once A's response has fully arrived from the server; the route
    // then waits on `releaseA` before handing it to the page.
    const aFetched = promiseWithResolvers<void>()
    const releaseA = promiseWithResolvers<void>()
    // Resolved once the held response was handed to the page, so teardown can
    // dispose the route safely (disposing first makes the pending `fulfill`
    // throw).
    const aFulfilled = promiseWithResolvers<void>()

    const lazyRoute = async (route: Route) => {
      const ids = await lazyTargetsOf(route.request().url())
      if (!ids.some((id) => id.includes('page-a'))) {
        return route.continue()
      }
      const response = await route.fetch()
      aFetched.resolve()
      await releaseA.promise
      await route.fulfill({ response })
      aFulfilled.resolve()
    }
    const router = await page.route('**/__rolldown_hmr_patch.js?*', lazyRoute)

    try {
      await page.click('#route-a-btn')
      await aFetched.promise

      // B is requested while A's bytes are held back from the page, so the
      // client does not hold shared.js yet and B must carry it.
      await page.click('#route-b-btn')
      const bodyB = await lazyBody('page-b')
      expect(bodyB).toMatch(factoryFor('page-b.js'))
      expect(bodyB).toMatch(factoryFor('shared.js'))

      await expect
        .poll(() => page.textContent('#route-b-content'))
        .toBe('B:shared-value')

      releaseA.resolve()
      await expect
        .poll(() => page.textContent('#route-a-content'))
        .toBe('A:shared-value')
      expect(await lazyBody('page-a')).toMatch(factoryFor('shared.js'))
    } finally {
      releaseA.resolve()
      await aFulfilled.promise
      await router.dispose()
    }
  })

  test('a chunk requested after the earlier chunks were evaluated omits the shared factory', async () => {
    await page.click('#route-c-btn')
    await expect
      .poll(() => page.textContent('#route-c-content'))
      .toBe('C:shared-value')

    const bodyC = await lazyBody('page-c')
    expect(bodyC).toMatch(factoryFor('page-c.js'))
    expect(bodyC).not.toMatch(factoryFor('shared.js'))
  })
})
