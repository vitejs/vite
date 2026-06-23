import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.webmanifest` is the FIRST entry in the `// other` group of `KNOWN_ASSET_TYPES`
// (constants.ts:183, directly after the fonts cluster `'otf'` :180 under the `// other`
// comment :182, before `'pdf'` :184 / `'txt'` :185), handled by the SAME extension-keyed
// asset pipeline as its font siblings `.woff`/`.woff2`/`.eot`/`.ttf`/`.otf`, the media
// cluster `.vtt`/`.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`,
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// IMPORTANT: a `.webmanifest` is JSON TEXT (a web app manifest), but Vite does NOT parse
// it as JSON — `.webmanifest` ∈ KNOWN_ASSET_TYPES, so `import u from './sample.webmanifest'`
// returns a URL STRING (the asset pipeline handles the extension, NOT the JSON plugin).
// `sample.webmanifest` is >4096 B, so it takes the EMITTED-asset path (a real hashed
// `/assets/sample-<hash>.webmanifest`), not the small-file inline `data:` URI path (the
// >4096 B path is the one the FBM milestone cares about, and the one that froze for CSS
// `?url` / the image cluster / the media cluster / `.woff` / `.woff2` / `.eot` / `.ttf` / `.otf`).
//
// NOTE: like `.otf`/`.ttf`/`.woff`/`.woff2` (and unlike `.eot`, which `registerCustomMime()`
// adds at asset.ts:73 so it serves `application/vnd.ms-fontobject`), `.webmanifest` is NOT in
// `registerCustomMime()` (asset.ts:63-74 registers only ico/cur/flac/eot), so its served
// Content-Type comes from mrmime's built-in map (`application/manifest+json`). That is only a
// MIME-source difference — NOT type-specific emit/HMR routing — so it does not change FBM's
// emitted-asset behavior vs. its font/media/image siblings.
//
// Vite's asset pipeline is EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189), not
// content-validating, so the bytes flow through the identical pipeline. The file is a valid
// JSON web app manifest, padded >4096 B, holding a UNIQUE single-occurrence needle
// (`WEBMANIFEST-FBM-MARKER-V1`, in `"name"`) so the spec can assert the served bytes via
// fetch() and edit them cleanly.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.webmanifest`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.webmanifest import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('webmanifest loaded')

    const url = await page.textContent('.webmanifest-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.webmanifest/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.webmanifest-fetched')
    expect(fetched).toContain('WEBMANIFEST-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / the media
  //    cluster / `.woff` / `.woff2` / `.eot` / `.ttf` / `.otf`): editing the asset's bytes
  //    does NOT update what the emitted URL serves. The emitted asset content is FROZEN at
  //    the initial value (the URL hash does not change either), so fetch(url) keeps returning
  //    the pre-edit bytes; there is no full reload. Marked `test.fails` so the committed
  //    suite stays green while documenting the FBM gap (see RESULT.md ".otf" / ".ttf" /
  //    ".woff" / ".eot" / ".vtt" / ".png" / "CSS `?url`" — emitted-asset content is not
  //    re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.webmanifest`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.webmanifest serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.webmanifest-fetched')
    expect(fetchedBefore).toContain('WEBMANIFEST-FBM-MARKER-V1')

    editFile('sample.webmanifest', (code) =>
      code.replace('WEBMANIFEST-FBM-MARKER-V1', 'WEBMANIFEST-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.webmanifest-fetched'), { timeout: 5000 })
      .toContain('WEBMANIFEST-FBM-MARKER-V2')
  })
}
