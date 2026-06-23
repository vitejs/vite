import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `?worker` cases from playground/worker.
// vite ref: playground/worker/__tests__/es/worker-es.spec.ts
//   `test('normal')` (L6-22): `import myWorker from '../my-worker.ts?worker'`,
//      `new myWorker()` + `postMessage('ping')` -> `.pong` matches 'pong'.
//   `test('inlined')` (L34-36): `import InlineWorker from '../my-worker.ts?worker&inline'`,
//      `new InlineWorker()` round-trip -> `.pong-inline` matches 'pong'.
//   `?worker&url`: playground/worker/worker/main-url.js L1-12 imports
//      `'../simple-worker?worker&url'` and does `new Worker(workerUrl, {type:'module'})`.
//   + index.html / worker/main-module.js L17-37 (the ping/pong round-trip wiring).

// ---------------------------------------------------------------------------
// LOAD — the worker spawns and the postMessage round-trip succeeds. This is the
// critical check: if the emitted worker URL were an unresolved `__ROLLDOWN_ASSET__`
// placeholder or a 404, `new Worker(url)` would fail to start and no reply would
// ever arrive. Same value Vite asserts ('pong'), NOT weakened.
// ---------------------------------------------------------------------------
test('?worker spawns + round-trips under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.pong')).toBe('pong')
})

test('?worker&inline spawns + round-trips under FBM (Blob/data: URL)', async () => {
  await expect.poll(() => page.textContent('.pong-inline')).toBe('pong')
})

test('?worker&url is a real URL (not a placeholder) and the worker it points at loads', async () => {
  // The ?worker&url value must be a REAL resolvable URL, not an unresolved
  // `__ROLLDOWN_ASSET__`/`__VITE_WORKER_ASSET__` placeholder.
  const url = await page.textContent('.worker-url')
  expect(url).toBeTruthy()
  expect(url).not.toMatch(
    /__ROLLDOWN_ASSET__|__VITE_ASSET__|__VITE_WORKER_ASSET__/,
  )
  // It is either a served dev URL or an inline blob/data URL.
  expect(url).toMatch(/^(\/|https?:|blob:|data:)/)

  // And the worker spawned from that URL actually loads + round-trips.
  await expect.poll(() => page.textContent('.pong-url')).toBe('pong')
})

// ---------------------------------------------------------------------------
// HMR — editing the worker module updates the round-trip reply. This PASSES under FBM
// (unlike the emitted-asset freeze of §4 `?url` / §5 `.wasm`). The `vite:worker` plugin
// has its OWN watch+invalidate+re-bundle+re-emit machinery: it `addWatchFile`s the worker
// source (plugins/worker.ts:496-498), `watchChange` marks the bundle invalidated
// (:666-671 -> `invalidateAffectedBundles` :98-104), the next `?worker` load drops the
// stale bundle (`removeBundleIfInvalidated` :169 / :106-111) and re-bundles fresh, and
// `generateBundle` re-emits the worker asset (:632-663). Editing the worker source is NOT
// an HMR-graph change for the main FBM bundle, so it triggers a FULL PAGE RELOAD (verified:
// page `load` fires, emitted worker URL hash changes my-worker-BBjXHPzg.js -> -CQH4GE7u.js);
// the reload re-imports `?worker` at the new hashed URL and spawns the updated worker.
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
