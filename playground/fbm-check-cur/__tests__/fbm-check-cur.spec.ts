import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" →
//   `test('relative')` lines 130-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.cur` is in `KNOWN_ASSET_TYPES` (constants.ts:160, directly after `'avif'` :159 /
// before `'jxl'` :161), handled by the SAME extension-keyed asset pipeline as
// `.png`/`.jpg`/`.apng`/`.bmp`/`.gif`/`.svg`/`.ico`/`.webp`/`.avif`.
//
// `import curUrl from './sample.cur'` returns a URL STRING. `sample.cur` is >4096 B,
// so it takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.cur`), not
// the small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / `.apng` / `.bmp` / `.png` / `.jpg` /
// `.jfif` / `.pjpeg` / `.pjp` / `.gif` / `.svg` / `.ico` / `.webp` / `.avif`).
//
// Vite's asset pipeline is EXTENSION-keyed (not content-validating), so `.cur` may hold
// any bytes; here it holds KNOWN text content so the spec can assert the served bytes via
// fetch() and edit them with a UNIQUE single-occurrence needle (`CUR-FBM-MARKER-V1`),
// avoiding the comment-collision artifact that made the .less/.styl/.pcss verdicts a
// test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.cur`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.cur import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('cur loaded')

    const url = await page.textContent('.cur-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.cur/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.cur-fetched')
    expect(fetched).toContain('CUR-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / `.apng` / `.bmp` / `.png` /
  //    `.jpg` / `.jfif` / `.pjpeg` / `.pjp` / `.gif` / `.svg` / `.ico` / `.webp` / `.avif`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".avif" / ".webp" / ".ico" / ".gif" / ".png" / "CSS `?url`" — emitted-asset
  //    content is not re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.cur`
  // (UNCHANGED), a fresh `no-store` fetch returns 200 with the STALE pre-edit bytes,
  // and the pre-grabbed element handle stays attached (no full reload).
  test.fails('.cur serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.cur-fetched')
    expect(fetchedBefore).toContain('CUR-FBM-MARKER-V1')

    editFile('sample.cur', (code) =>
      code.replace('CUR-FBM-MARKER-V1', 'CUR-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.cur-fetched'), { timeout: 5000 })
      .toContain('CUR-FBM-MARKER-V2')
  })
}
