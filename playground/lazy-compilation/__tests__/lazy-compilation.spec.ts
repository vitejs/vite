import path from 'node:path'
import type { Response, Route } from 'playwright-chromium'
import { normalizePath } from 'vite'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  browser,
  editFile,
  isServe,
  page,
  promiseWithResolvers,
  viteServer,
  viteTestUrl,
} from '~utils'

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
// Both tests share one page session on purpose. A lazy entry is compiled by
// `/@vite/lazy` only until it is first fetched on this server; a later page
// load is redirected to its built chunk. So the second test cannot reload — it
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

const bundledDev = () => viteServer.environments.client.bundledDev as any

const rebuildLanded = async () => {
  const state = await bundledDev().devEngine.getBundleState()
  return !state.hasStaleOutput
}

// the map is keyed by rolldown's module id, which keeps backslashes on Windows
const builtChunkFor = (file: string): string | undefined => {
  const id = path.posix.join(viteServer.config.root, file)
  for (const [key, chunk] of bundledDev().builtLazyChunks as Map<
    string,
    string
  >) {
    if (normalizePath(key) === id) return chunk
  }
}

const sharedRuns = (p: typeof page) =>
  p.evaluate(() => (globalThis as any).__sharedRuns as number)

describe.runIf(isServe)('lazy compilation: reload after fetch', () => {
  test('a reload after the first fetch loads the route from the built chunk', async () => {
    await expect.poll(rebuildLanded).toBe(true)

    const lazyStatuses: number[] = []
    const chunkRequests: string[] = []
    page.on('response', (res) => {
      if (res.url().includes('/@vite/lazy?')) lazyStatuses.push(res.status())
    })
    page.on('request', (req) => {
      if (/\/assets\/page-a-.*\.js$/.test(req.url()))
        chunkRequests.push(req.url())
    })

    await page.reload()
    await page.click('#route-a-btn')
    await expect
      .poll(() => page.textContent('#route-a-content'))
      .toBe('A:shared-value')

    expect(lazyStatuses).toEqual([302])
    expect(chunkRequests).toHaveLength(1)
  })

  test('a page that loaded before an edit gets the edited route', async () => {
    const context = await browser.newContext()
    const other = await context.newPage()
    await other.goto(viteTestUrl)
    await expect
      .poll(() => other.textContent('#route-b-content'))
      .toBe('pending')

    // Wait until the server has seen the edit, so the click is not racing
    // the watcher. Nothing has run B since the reload, so no rebuild follows;
    // the output just turns stale and the click compiles from source.
    await expect.poll(rebuildLanded).toBe(true)
    const before = builtChunkFor('page-b.js')
    expect(before).toBeDefined()
    editFile('page-b.js', (code) => code.replace('B:', 'B-edited:'))
    await expect
      .poll(
        async () =>
          !(await rebuildLanded()) || builtChunkFor('page-b.js') !== before,
      )
      .toBe(true)

    await other.click('#route-b-btn')
    await expect
      .poll(() => other.textContent('#route-b-content'))
      .toBe('B-edited:shared-value')
    await context.close()
  })

  test('a page that took a lazy payload keeps taking them, so shared.js runs once', async () => {
    // With no client that ran A, an edit to A leaves the output stale
    // instead of rebuilding it.
    await page.reload()
    const context = await browser.newContext()
    const other = await context.newPage()
    try {
      await other.goto(viteTestUrl)
      await expect
        .poll(() => other.textContent('#route-a-content'))
        .toBe('pending')

      await expect.poll(rebuildLanded).toBe(true)
      editFile('page-a.js', (code) => code.replace('A:', 'A-edited:'))
      await expect.poll(async () => !(await rebuildLanded())).toBe(true)
      await other.click('#route-a-btn')
      await expect
        .poll(() => other.textContent('#route-a-content'))
        .toBe('A-edited:shared-value')
      await expect.poll(rebuildLanded).toBe(true)
      expect(builtChunkFor('page-b.js')).toBeDefined()

      // A built chunk for B would run shared.js a second time
      await other.click('#route-b-btn')
      await expect
        .poll(() => other.textContent('#route-b-content'))
        .toBe('B-edited:shared-value')
      expect(await sharedRuns(other)).toBe(1)
    } finally {
      await context.close()
    }
  })

  test('a click while the edit is still being processed gets the edited route', async () => {
    // The output turns stale only when the HMR task for the edit ends. The
    // `hold-page-b` plugin keeps that task inside `transform`.
    const holdPageB = viteServer.config.plugins.find(
      (p) => p.name === 'hold-page-b',
    )!.api as { hold: Promise<void> | null; holding: boolean }
    const taskHold = promiseWithResolvers<void>()
    // A redirected chunk is held until the page has seen the update, so the
    // update cannot repair the page.
    const chunkHold = promiseWithResolvers<void>()
    // The page has not run B, so it never fetches the patch; the update
    // message is the only trace.
    const updateReceived = promiseWithResolvers<void>()

    await expect.poll(rebuildLanded).toBe(true)
    const context = await browser.newContext()
    const held = await context.newPage()
    try {
      held.on('websocket', (ws) => {
        ws.on('framereceived', (frame) => {
          if (String(frame.payload).includes('bundled-dev-update')) {
            updateReceived.resolve()
          }
        })
      })
      await held.goto(viteTestUrl)
      await expect
        .poll(() => held.textContent('#route-b-content'))
        .toBe('pending')
      await expect.poll(rebuildLanded).toBe(true)
      expect(builtChunkFor('page-b.js')).toBeDefined()
      await held.route('**/assets/page-b-*.js', async (route) => {
        await chunkHold.promise
        await route.continue()
      })

      holdPageB.hold = taskHold.promise
      editFile('page-b.js', (code) =>
        code.replace('B-edited:', 'B-edited-twice:'),
      )
      await expect.poll(() => holdPageB.holding).toBe(true)

      const lazyRequest = held.waitForRequest((req) =>
        req.url().includes('/@vite/lazy?'),
      )
      await held.click('#route-b-btn')
      await lazyRequest

      taskHold.resolve()
      await updateReceived.promise
      chunkHold.resolve()

      await expect
        .poll(() => held.textContent('#route-b-content'))
        .toBe('B-edited-twice:shared-value')
    } finally {
      holdPageB.hold = null
      taskHold.resolve()
      chunkHold.resolve()
      await context.close()
    }
  })
})
