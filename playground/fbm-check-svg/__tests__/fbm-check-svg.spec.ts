import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset SVG URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts (`test('?no-inline svg import')`
//   L501-507, asserting the imported svg URL resolves to a real served asset; build:
//   `/foo/bar/assets/fragment-[-\w]{8}\.svg`) + playground/assets/index.html
//   (L550-551, `import svgFrag from './nested/fragment.svg'; text('.svg-frag-import-path', svgFrag)`).
//
// `.svg` is in `KNOWN_ASSET_TYPES` (constants.ts:156). UNLIKE the other image types it
// has SVG-SPECIFIC inline handling in the asset plugin: a SMALL svg (<4096 B, no `#`
// fragment) is inlined as a URL-encoded `data:image/svg+xml,...` data URI via
// `svgToDataURL` (asset.ts:351-356, 579-580, 591-610), NOT base64; a `>=4096 B` svg
// takes the SAME emitted-asset path as `.png`/`.gif` (a real hashed `/assets/sample-<hash>.svg`).
//
// `sample.svg` is a valid SVG XML doc, >=4096 B, with NO `#` fragment, so it deliberately
// exercises the EMITTED-asset path (the one the FBM milestone cares about, and the one
// that froze for CSS `?url` / `.apng` / `.bmp` / `.png` / `.jpg` / `.gif`). The unique
// marker `SVG-FBM-MARKER-V1` is a single-occurrence element id attribute (NOT in a
// comment), so the HMR edit lands on a clean needle (avoiding the comment-collision
// artifact that made the .less/.styl/.pcss verdicts a test artifact).
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.svg`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder, and NOT a `data:` URI (which a
  //    <4096 B svg would have been inlined as) — and fetch(url) returns the known svg bytes.
  test('.svg import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('svg loaded')

    const url = await page.textContent('.svg-url')
    // Real emitted asset URL (>=4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.svg/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real svg bytes (the marker
    // lives as an element id, so this confirms it is the served SVG document, not a
    // placeholder or a 404).
    const fetched = await page.textContent('.svg-fetched')
    expect(fetched).toContain('SVG-FBM-MARKER-V1')
    expect(fetched).toContain('<svg')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / `.apng` / `.bmp` / `.png` /
  //    `.jpg` / `.gif`): editing the asset's bytes does NOT update what the emitted URL
  //    serves. The emitted asset content is FROZEN at the initial value (the URL hash does
  //    not change either), so fetch(url) keeps returning the pre-edit bytes; there is no
  //    full reload. Marked `test.fails` so the committed suite stays green while documenting
  //    the FBM gap (see RESULT.md ".gif" / ".png" / "CSS `?url`" / ".apng" — emitted-asset
  //    content is not re-emitted on HMR; #22596 family). `.svg`'s SVG-specific code path
  //    only governs the small-file INLINE branch; on the >=4096 B emitted path it joins the
  //    generic asset pipeline and inherits the same freeze.
  //
  // Captured empirically under FBM: URL before/after = `/assets/sample-<hash>.svg`
  // (UNCHANGED), a fresh `no-store` fetch returns 200 with the STALE pre-edit bytes,
  // and the pre-grabbed element handle stays attached (no full reload).
  test.fails('.svg serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.svg-fetched')
    expect(fetchedBefore).toContain('SVG-FBM-MARKER-V1')

    editFile('sample.svg', (code) =>
      code.replace('SVG-FBM-MARKER-V1', 'SVG-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.svg-fetched'), { timeout: 5000 })
      .toContain('SVG-FBM-MARKER-V2')
  })
}
