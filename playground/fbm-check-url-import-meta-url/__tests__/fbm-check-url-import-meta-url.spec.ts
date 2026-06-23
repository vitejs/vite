import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `new URL('./asset', import.meta.url)` ASSET case in
// playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts (`test('new URL(..., import.meta.url)')`,
//   L571-597 — asserts `.import-meta-url` text matches the resolved asset URL `imgMatch`,
//   then in serve mode edits `import-meta-url/img.png` and expects a FULL RELOAD
//   (`page.waitForEvent('load')`), with the URL still matching after the reload) +
//   playground/assets/index.html (L604-606,
//   `const metaUrl = new URL('./import-meta-url/img.png', import.meta.url); text('.import-meta-url', metaUrl)`).
//
// `new URL('./sample.png', import.meta.url)` is rewritten by `vite:asset-import-meta-url`
// (plugins/assetImportMetaUrl.ts) to the resolved asset URL. `sample.png` is >4096 B so it
// takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.png`), not the
// small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone cares
// about).
//
// Vite's asset pipeline is EXTENSION-keyed (not content-validating), so `.png` may hold any
// bytes; here it holds KNOWN text content so the spec can assert the served bytes via
// fetch() and edit them with a UNIQUE single-occurrence needle (`FBM-IMU-MARKER-V1`),
// avoiding the comment-collision artifact that made the .less/.styl/.pcss verdicts a test
// artifact.
//
// Result: BOTH halves PASS under FBM. Unlike the plain `?url` / `.png` emitted-asset path
// (which FREEZES because its `vite:asset` load branch never `addWatchFile`s the source),
// `vite:asset-import-meta-url` DOES `addWatchFile(file)` (assetImportMetaUrl.ts:152), so an
// edit drives a fresh full re-bundle (`onOutput` re-emits the asset with a new hash) +
// full reload — the served bytes refresh. See RESULT.md §7.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (PASS): `new URL('./sample.png', import.meta.url)` resolves to a URL
  //    string that genuinely points at the asset — a real hashed `/assets/sample-<hash>.png`,
  //    NOT an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder, and NOT a raw
  //    `import.meta.url`-relative path that 404s — and fetch(url) returns the known bytes.
  test('new URL(..., import.meta.url) resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('imu loaded')

    const url = await page.textContent('.imu-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.png/)
    // NOT an unresolved placeholder.
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)

    // Strongest resolution check: fetch(url) returns the real asset bytes (catches a
    // placeholder or a 404 that the URL-shape check alone would miss).
    const fetched = await page.textContent('.imu-fetched')
    expect(fetched).toContain('FBM-IMU-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (PASS — FRESH, not frozen): editing the asset's bytes refreshes what the
  //    emitted URL serves. Because `vite:asset-import-meta-url` `addWatchFile`s the source
  //    (assetImportMetaUrl.ts:152), the edit fires an HMR event that resolves to a
  //    FullReload → a full `onOutput` re-bundle re-emits the asset with a NEW hash into
  //    `memoryFiles` (bundledDev.ts:180-189) → fetch(url) returns the edited bytes. This
  //    genuinely differs from the plain `?url` / `.png` emitted-asset path, whose
  //    `vite:asset` load branch never `addWatchFile`s → the edit fires no event → frozen.
  test('new URL(..., import.meta.url) serves the UPDATED bytes after an HMR edit under FBM', async () => {
    const fetchedBefore = await page.textContent('.imu-fetched')
    expect(fetchedBefore).toContain('FBM-IMU-MARKER-V1')

    editFile('sample.png', (code) =>
      code.replace('FBM-IMU-MARKER-V1', 'FBM-IMU-MARKER-V2'),
    )

    // The served asset reflects the edited bytes (fresh).
    await expect
      .poll(() => page.textContent('.imu-fetched'), { timeout: 5000 })
      .toContain('FBM-IMU-MARKER-V2')

    // non-vacuity: the pre-edit marker is gone (the served bytes genuinely refreshed —
    // a freeze would keep returning V1). Verified adversarially during examination:
    // polling for a marker the edit never writes times out, so this poll is meaningful.
    const fetchedAfter = await page.textContent('.imu-fetched')
    expect(fetchedAfter).not.toContain('FBM-IMU-MARKER-V1')
  })
}
