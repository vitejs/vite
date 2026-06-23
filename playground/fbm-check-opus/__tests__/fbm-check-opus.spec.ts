import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.opus` is the EIGHTH media entry in `KNOWN_ASSET_TYPES` (constants.ts:171, directly
// after `'aac'` :170 under the `// media` comment :163), handled by the SAME
// extension-keyed asset pipeline as `.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4` and the
// image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import opusUrl from './sample.opus'` returns a URL STRING. `sample.opus` is >4096 B,
// so it takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.opus`), not
// the small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac`).
//
// Vite's asset pipeline is EXTENSION-keyed (not content-validating), so `.opus` may hold
// any bytes; here it holds KNOWN text content so the spec can assert the served bytes via
// fetch() and edit them with a UNIQUE single-occurrence needle (`OPUS-FBM-MARKER-V1`).
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.opus`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.opus import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('opus loaded')

    const url = await page.textContent('.opus-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.opus/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.opus-fetched')
    expect(fetched).toContain('OPUS-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".aac" / ".flac" / ".wav" / ".mp3" / ".ogg" / ".webm" / ".mp4" / ".jxl" /
  //    ".png" / "CSS `?url`" — emitted-asset content is not re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.opus`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.opus serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.opus-fetched')
    expect(fetchedBefore).toContain('OPUS-FBM-MARKER-V1')

    editFile('sample.opus', (code) =>
      code.replace('OPUS-FBM-MARKER-V1', 'OPUS-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.opus-fetched'), { timeout: 5000 })
      .toContain('OPUS-FBM-MARKER-V2')
  })
}
