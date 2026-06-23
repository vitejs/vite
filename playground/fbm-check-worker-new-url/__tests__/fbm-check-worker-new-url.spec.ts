import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `new Worker(new URL(..., import.meta.url), { type: 'module' })`
// case from playground/worker.
// vite ref: playground/worker/worker/main-module.js L111-119
//   `const w = new Worker(new URL('../url-worker.js', import.meta.url), workerOptions)`
//   (workerOptions = { type: 'module' }), asserted by
//   playground/worker/__tests__/es/worker-es.spec.ts `test('module worker')` L146-159 via
//   `.worker-import-meta-url`.toMatch('A string').
// The worker source here does a ping/pong round-trip (strictly stronger than Vite's
// url-worker.js, which only posts once on startup) and also reports its own
// `self.location.href` so we can assert the spawned worker URL is real.

// ---------------------------------------------------------------------------
// LOAD — the worker spawns and the postMessage round-trip succeeds. If the
// `new URL(...)` rewrite produced an unresolved `__ROLLDOWN_ASSET__`/
// `__VITE_WORKER_ASSET__` placeholder or a 404, `new Worker(url)` would fail to
// start and no reply would ever arrive. Same reply value Vite's worker round-trips
// assert ('pong'), NOT weakened.
// ---------------------------------------------------------------------------
test('new Worker(new URL(...)) spawns + round-trips under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.pong')).toBe('pong')
})

test('the spawned worker URL is a real served asset (not a placeholder/404)', async () => {
  // `self.location.href` reported by the worker = the actual URL it was loaded from.
  const url = await page.textContent('.worker-url')
  expect(url).toBeTruthy()
  expect(url).not.toMatch(
    /__ROLLDOWN_ASSET__|__VITE_ASSET__|__VITE_WORKER_ASSET__/,
  )
  // A module worker loaded from a real served URL (http(s):) or, if inlined, a
  // blob:/data: URL.
  expect(url).toMatch(/^(https?:|blob:|data:)/)
})

// ---------------------------------------------------------------------------
// HMR — editing the worker module updates the round-trip reply. Like `?worker`
// (§6), the `new Worker(new URL(...))` form routes through the SAME `vite:worker`
// machinery: `workerImportMetaUrl.ts:257-263` calls `workerFileToUrl` (the dedicated
// worker bundle + WorkerOutputCache) and rewrites to the emitted URL via
// `toOutputFilePathInJSForBundledDev`, and `:267-269` `addWatchFile`s the worker
// source — so an edit is watched, `watchChange` (worker.ts:666-670) invalidates the
// bundle, the next load re-bundles fresh, and `generateBundle` re-emits (worker.ts:632-663).
// The worker source is outside the main FBM graph, so the edit triggers a FULL PAGE
// RELOAD (not an in-place hot patch); after reload the page re-spawns the updated worker.
// This is FRESH (not frozen like the §4 `?url` / §5 `.wasm` emitted-asset path).
// ---------------------------------------------------------------------------
if (!isBuild) {
  test('editing the worker module updates the round-trip reply under FBM', async () => {
    await expect.poll(() => page.textContent('.pong')).toBe('pong')

    editFile('my-worker.js', (code) =>
      code.replace("const msg = 'pong'", "const msg = 'pong-updated'"),
    )

    try {
      await expect
        .poll(() => page.textContent('.pong'), { timeout: 5000 })
        .toBe('pong-updated')
    } finally {
      editFile('my-worker.js', (code) =>
        code.replace("const msg = 'pong-updated'", "const msg = 'pong'"),
      )
    }
  })
}
