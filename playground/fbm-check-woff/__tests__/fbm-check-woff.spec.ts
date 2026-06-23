import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.woff` is the FIRST font entry in `KNOWN_ASSET_TYPES` (constants.ts:177, the
// `'woff2?'` token under the `// fonts` comment :176 — the `2?` makes the `2` optional
// so it matches BOTH `woff` and `woff2`), handled by the SAME extension-keyed asset
// pipeline as the media cluster `.vtt`/`.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import woffUrl from './sample.woff'` returns a URL STRING. `sample.woff` is >4096 B,
// so it takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.woff`), not
// the small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac` / `.opus` / `.mov` / `.m4a` / `.vtt`).
//
// A real `.woff` is a binary font container, but Vite's asset pipeline is EXTENSION-KEYED
// (DEFAULT_ASSETS_RE constants.ts:188-189), not content-validating, so the bytes flow
// through the identical pipeline regardless of payload. The file holds a WOFF-ish
// signature plus padding AND a UNIQUE single-occurrence needle (`WOFF-FBM-MARKER-V1`) so
// the spec can assert the served bytes via fetch() and edit them cleanly.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.woff`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.woff import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('woff loaded')

    const url = await page.textContent('.woff-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.woff/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.woff-fetched')
    expect(fetched).toContain('WOFF-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac` / `.opus` / `.mov` / `.m4a` / `.vtt`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".vtt" / ".m4a" / ".mov" / ".opus" / ".aac" / ".flac" / ".wav" / ".mp3" /
  //    ".ogg" / ".webm" / ".mp4" / ".jxl" / ".png" / "CSS `?url`" — emitted-asset content is not re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.woff`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.woff serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.woff-fetched')
    expect(fetchedBefore).toContain('WOFF-FBM-MARKER-V1')

    editFile('sample.woff', (code) =>
      code.replace('WOFF-FBM-MARKER-V1', 'WOFF-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.woff-fetched'), { timeout: 5000 })
      .toContain('WOFF-FBM-MARKER-V2')
  })
}
