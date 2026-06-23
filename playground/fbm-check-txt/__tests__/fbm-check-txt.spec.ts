import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.txt` sits LAST in the `// other` group of `KNOWN_ASSET_TYPES` (constants.ts:185,
// directly after `'pdf'` :184, under the `// other` comment :182, after the fonts
// cluster `'otf'` :180), handled by the SAME extension-keyed asset pipeline as its
// font siblings `.woff`/`.woff2`/`.eot`/`.ttf`/`.otf`, the `.webmanifest`/`.pdf`
// siblings, the media cluster `.vtt`/`.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`,
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// CRITICAL `.txt` nuance: a DEFAULT `import u from './sample.txt'` returns a URL STRING
// (the asset pipeline owns the extension), NOT the text content — reading the TEXT is
// the `?raw` query's job (asset.ts:150 / asset.ts:241 `moduleType:'js'` "to avoid
// double `export default` in `.txt`s"). So this is the asset-URL case, identical in
// shape to `.png`/`.pdf`/the font cluster. `sample.txt` is >4096 B, so it takes the
// EMITTED-asset path (a real hashed `/assets/sample-<hash>.txt`), not the small-file
// inline `data:` URI path (the >4096 B path is the one the FBM milestone cares about,
// and the one that froze for CSS `?url` / the image cluster / the media cluster /
// `.woff` / `.woff2` / `.eot` / `.ttf` / `.otf` / `.webmanifest` / `.pdf`).
//
// NOTE: like `.otf`/`.ttf`/`.woff`/`.woff2`/`.webmanifest`/`.pdf` (and unlike `.eot`,
// which `registerCustomMime()` adds at asset.ts:73 so it serves
// `application/vnd.ms-fontobject`), `.txt` is NOT in `registerCustomMime()`
// (asset.ts:63-74 registers only ico/cur/flac/eot), so its served Content-Type comes
// from mrmime's built-in map (`text/plain`). That is only a MIME-source difference —
// NOT type-specific emit/HMR routing — so it does not change FBM's emitted-asset
// behavior vs. its font/media/image/webmanifest/pdf siblings.
//
// Vite's asset pipeline is EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189), not
// content-validating, so the bytes flow through the identical pipeline. The file holds a
// UNIQUE single-occurrence needle (`TXT-FBM-MARKER-V1`) so the spec can assert the served
// bytes via fetch() and edit them cleanly (V1->V2 keeps the same byte length).
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.txt`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.txt import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('txt loaded')

    const url = await page.textContent('.txt-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.txt/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes (the
    // TXT-FBM-MARKER-V1 needle is plain ASCII, so it appears verbatim in the body).
    const fetched = await page.textContent('.txt-fetched')
    expect(fetched).toContain('TXT-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / the media
  //    cluster / `.woff` / `.woff2` / `.eot` / `.ttf` / `.otf` / `.webmanifest` / `.pdf`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".pdf" / ".webmanifest" / ".otf" / ".ttf" / ".woff" / ".eot" / ".vtt" /
  //    ".png" / "CSS `?url`" — emitted-asset content is not re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.txt`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.txt serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.txt-fetched')
    expect(fetchedBefore).toContain('TXT-FBM-MARKER-V1')

    editFile('sample.txt', (code) =>
      code.replace('TXT-FBM-MARKER-V1', 'TXT-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.txt-fetched'), { timeout: 5000 })
      .toContain('TXT-FBM-MARKER-V2')
  })
}
