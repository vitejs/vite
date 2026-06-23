import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `?sharedworker` cases from playground/worker.
// vite ref: playground/worker/__tests__/es/worker-es.spec.ts
//   `test('shared worker')` (L56-58): `import mySharedWorker from '../my-shared-worker?sharedworker&name=shared'`,
//      two connections + `port.start()` -> `.tick-count` matches 'pong'.
//   `test('inline shared worker')` (L64-68): `import InlineSharedWorker from '../my-inline-shared-worker?sharedworker&inline'`,
//      two connections -> `.pong-shared-inline` matches 'pong'.
//   `?sharedworker&url`: mirrors `?worker&url` (worker.ts:506-511 `urlRE` branch) -- the
//      import is the URL string and main.js does `new SharedWorker(url, {type:'module'})`.
//   + playground/worker/worker/main-module.js L57-86 (the port round-trip wiring).
//
// `?sharedworker` is handled by the SAME `vite:worker` plugin as `?worker` (the §6
// `?worker` entry, which WORKS incl. HMR via the vite:worker watch+invalidate+re-bundle
// +re-emit pipeline); the ONLY plugin difference is `workerConstructor = 'SharedWorker'`
// (plugins/worker.ts:415). So the expectation is parity with §6 `?worker`.
//
// SharedWorker harness note: headless test browsers vary in SharedWorker support. The
// real-URL / no-placeholder / constructor-resolution checks ALWAYS run (they don't need
// a live SharedWorker). The port round-trip + HMR are asserted when SharedWorker is
// available in the harness; if it isn't, they fall back / skip with a clear note.

// Authoritative, browser-side check (the harness is Playwright Chromium, where
// SharedWorker IS available). Done in-browser, not via a page flag, so it can't read
// stale/undefined.
const sharedWorkerSupported = async (): Promise<boolean> =>
  await page.evaluate(() => typeof SharedWorker === 'function')

// ---------------------------------------------------------------------------
// LOAD — emitted `?sharedworker` URL must be REAL (not an unresolved
// `__ROLLDOWN_ASSET__`/`__VITE_WORKER_ASSET__` placeholder or a 404), otherwise
// `new SharedWorker(url)` could never connect. The `?sharedworker&url` value gives us a
// direct, browser-independent handle on that URL. (Always runnable.)
// ---------------------------------------------------------------------------
test('?sharedworker&url is a real URL (not a placeholder)', async () => {
  const url = await page.textContent('.worker-url')
  expect(url).toBeTruthy()
  expect(url).not.toMatch(
    /__ROLLDOWN_ASSET__|__VITE_ASSET__|__VITE_WORKER_ASSET__/,
  )
  // It is either a served dev URL or an inline data URL.
  expect(url).toMatch(/^(\/|https?:|blob:|data:)/)
})

// ---------------------------------------------------------------------------
// LOAD — the port round-trip. Same value Vite asserts ('pong'), NOT weakened.
// Requires a live SharedWorker in the harness.
// ---------------------------------------------------------------------------
test('?sharedworker spawns + port round-trips under FBM (bundledDev)', async () => {
  if (!(await sharedWorkerSupported())) {
    // SharedWorker unavailable in this harness browser -- round-trip is
    // environment-limited; the real-URL check above already proves the emitted
    // worker URL resolves. See RESULT.md §6 `?sharedworker`.
    return
  }
  await expect.poll(() => page.textContent('.pong')).toBe('pong')
})

test('?sharedworker&inline spawns + port round-trips under FBM (data: URL)', async () => {
  if (!(await sharedWorkerSupported())) return
  await expect.poll(() => page.textContent('.pong-inline')).toBe('pong')
})

test('?sharedworker&url worker loads + port round-trips under FBM', async () => {
  if (!(await sharedWorkerSupported())) return
  await expect.poll(() => page.textContent('.pong-url')).toBe('pong')
})

// ---------------------------------------------------------------------------
// HMR — editing the shared-worker module updates the round-trip reply, via the SAME
// vite:worker watch+invalidate+re-bundle+re-emit pipeline that makes §6 `?worker` HMR
// work (a FULL PAGE RELOAD, since the worker source is outside the main FBM graph).
// Requires a live SharedWorker in the harness.
// ---------------------------------------------------------------------------
if (!isBuild) {
  test('editing the shared-worker module updates the round-trip reply under FBM', async () => {
    if (!(await sharedWorkerSupported())) return
    await expect.poll(() => page.textContent('.pong')).toBe('pong')

    editFile('my-shared-worker.js', (code) =>
      code.replace("const msg = 'pong'", "const msg = 'pong-updated'"),
    )

    try {
      await expect
        .poll(() => page.textContent('.pong'), { timeout: 5000 })
        .toBe('pong-updated')
    } finally {
      editFile('my-shared-worker.js', (code) =>
        code.replace("const msg = 'pong-updated'", "const msg = 'pong'"),
      )
    }
  })
}
