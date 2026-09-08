import type { Response, Route } from 'playwright-chromium'
import { beforeAll, describe, expect, test } from 'vitest'
import { isServe, page, promiseWithResolvers } from '~utils'

// Regression test for rolldown/rolldown#10774.
//
// A lazy chunk omits every factory the server believes this client already
// holds. The server must learn that from the client (the chunk reports back
// after registering its factories), not from its own HTTP response finishing:
// bytes that left the server may still be on the wire while a later chunk is
// compiled, delivered and evaluated. If the server recorded delivery too
// early, the later chunk would omit a shared factory and `initModule` would
// throw `MissingFactoryError` in the browser.
//
// The spec makes that window deterministic with Playwright routing: A's
// response is fetched from the server (so the server finished writing it) but
// held back from the page until B has been requested and evaluated.
//
// Both tests share one page session on purpose. A lazy entry is served through
// `/@vite/lazy` only until it is first fetched on this server; a later page
// load gets it as an ordinary chunk. So the second test cannot reload — it
// continues from the state the first test leaves behind.

const factoryFor = (file: string) =>
  new RegExp(`registerFactory\\("[^"]*/${file}"`)

const lazyIdOf = (url: string) => new URL(url).searchParams.get('id') ?? ''

const lazyBodies: { id: string; body: Promise<string> }[] = []
const lazyBody = (route: string) =>
  lazyBodies.find((e) => e.id.includes(route))!.body

const onResponse = (res: Response) => {
  if (res.url().includes('/@vite/lazy?')) {
    lazyBodies.push({ id: lazyIdOf(res.url()), body: res.text() })
  }
}

describe.runIf(isServe)('lazy compilation', () => {
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
      if (!lazyIdOf(route.request().url()).includes('page-a')) {
        return route.continue()
      }
      const response = await route.fetch()
      aFetched.resolve()
      await releaseA.promise
      await route.fulfill({ response })
      aFulfilled.resolve()
    }
    const router = await page.route('**/@vite/lazy?*', lazyRoute)

    try {
      await page.click('#route-a-btn')
      await aFetched.promise

      // B is compiled while A's bytes are held back from the page, so the
      // client has not reported A yet and B must still carry shared.js.
      await page.click('#route-b-btn')
      await expect
        .poll(() => lazyBodies.some((e) => e.id.includes('page-b')))
        .toBe(true)
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
    // The client reports A and B over the websocket after evaluating them;
    // the next lazy request is a separate HTTP request, so give the reports
    // a moment to land before C is compiled.
    await new Promise((resolve) => setTimeout(resolve, 300))

    await page.click('#route-c-btn')
    await expect
      .poll(() => page.textContent('#route-c-content'))
      .toBe('C:shared-value')

    const bodyC = await lazyBody('page-c')
    expect(bodyC).toMatch(factoryFor('page-c.js'))
    expect(bodyC).not.toMatch(factoryFor('shared.js'))
  })
})
