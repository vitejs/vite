import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.otf` is a font entry in `KNOWN_ASSET_TYPES` (constants.ts:180, directly after the
// `'ttf'` token :179 under the `// fonts` comment :176), handled by the SAME
// extension-keyed asset pipeline as its font siblings `.woff`/`.woff2`/`.eot`/`.ttf`, the
// media cluster `.vtt`/`.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`,
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import otfUrl from './sample.otf'` returns a URL STRING. `sample.otf` is >4096 B,
// so it takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.otf`), not
// the small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / the image cluster / the media
// cluster / `.woff` / `.woff2` / `.eot` / `.ttf`).
//
// NOTE: unlike `.eot` (which `registerCustomMime()` adds at asset.ts:73 so it serves
// `application/vnd.ms-fontobject`), `.otf` is NOT in `registerCustomMime()`, so its
// served Content-Type comes from mrmime's built-in map (`font/otf`). That is only a
// MIME-source difference — NOT type-specific emit/HMR routing — so it does not change
// FBM's emitted-asset behavior vs. its font siblings (same as `.ttf`).
//
// A real `.otf` is a binary OpenType font container, but Vite's asset pipeline is
// EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189), not content-validating, so
// the bytes flow through the identical pipeline regardless of payload. The file holds an
// OTF sfnt signature ('OTTO') plus padding AND a UNIQUE single-occurrence needle
// (`OTF-FBM-MARKER-V1`) so the spec can assert the served bytes via fetch() and edit
// them cleanly.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.otf`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.otf import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('otf loaded')

    const url = await page.textContent('.otf-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.otf/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.otf-fetched')
    expect(fetched).toContain('OTF-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / the media
  //    cluster / `.woff` / `.woff2` / `.eot` / `.ttf`): editing the asset's bytes does NOT
  //    update what the emitted URL serves. The emitted asset content is FROZEN at the
  //    initial value (the URL hash does not change either), so fetch(url) keeps returning
  //    the pre-edit bytes; there is no full reload. Marked `test.fails` so the committed
  //    suite stays green while documenting the FBM gap (see RESULT.md ".woff" / ".woff2" /
  //    ".eot" / ".ttf" / ".vtt" / ".png" / "CSS `?url`" — emitted-asset content is not
  //    re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.otf`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.otf serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.otf-fetched')
    expect(fetchedBefore).toContain('OTF-FBM-MARKER-V1')

    editFile('sample.otf', (code) =>
      code.replace('OTF-FBM-MARKER-V1', 'OTF-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.otf-fetched'), { timeout: 5000 })
      .toContain('OTF-FBM-MARKER-V2')
  })
}
