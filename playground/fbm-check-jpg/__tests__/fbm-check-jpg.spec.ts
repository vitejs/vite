import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" →
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// This queue item covers BOTH `.jpg` AND `.jpeg`, which share the IDENTICAL
// extension-keyed asset pipeline, so we import one of each and assert both.
// `import jpgUrl from './sample.jpg'` / `import jpegUrl from './sample.jpeg'` each return
// a URL STRING. Both samples are >4096 B, so each takes the EMITTED-asset path (a real
// hashed `/assets/sample-<hash>.jpg|.jpeg`), not the small-file inline `data:` URI path
// (the >4096 B path is the one the FBM milestone cares about, and the one that froze for
// CSS `?url` / `.apng` / `.bmp` / `.png`).
//
// Vite's asset pipeline is EXTENSION-keyed (not content-validating), so `.jpg`/`.jpeg`
// may hold any bytes; here they hold KNOWN text content so the spec can assert the served
// bytes via fetch() and edit them with UNIQUE single-occurrence needles
// (`JPG-FBM-MARKER-V1` / `JPEG-FBM-MARKER-V1`), avoiding the comment-collision artifact
// that made the .less/.styl/.pcss verdicts a test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): each import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.jpg|.jpeg`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes. Both extensions are asserted.
  test('.jpg and .jpeg imports resolve to real served asset URLs under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('jpg+jpeg loaded')

    const jpgUrl = await page.textContent('.jpg-url')
    const jpegUrl = await page.textContent('.jpeg-url')
    // Real emitted asset URLs (>4096 B → not inlined as a data URI).
    expect(jpgUrl).toMatch(/\/assets\/sample-[-\w]+\.jpg/)
    expect(jpegUrl).toMatch(/\/assets\/sample-[-\w]+\.jpeg/)
    // NOT unresolved placeholders, NOT data URIs (would mean it was inlined).
    expect(jpgUrl).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(jpegUrl).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(jpgUrl).not.toMatch(/^data:/)
    expect(jpegUrl).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes for each.
    const jpgFetched = await page.textContent('.jpg-fetched')
    expect(jpgFetched).toContain('JPG-FBM-MARKER-V1')
    expect(jpgFetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)

    const jpegFetched = await page.textContent('.jpeg-fetched')
    expect(jpegFetched).toContain('JPEG-FBM-MARKER-V1')
    expect(jpegFetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / `.apng` / `.bmp` / `.png`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".jpg / .jpeg" / ".png" / "CSS `?url`" / ".apng" — emitted-asset content
  //    is not re-emitted on HMR; #22596 family). `.jpg` and `.jpeg` share the identical
  //    pipeline, so the freeze is demonstrated on `.jpg` (representative of both).
  //
  // Captured empirically under FBM: URL before/after = `/assets/sample-<hash>.jpg`
  // (UNCHANGED), a fresh `no-store` fetch returns 200 with the STALE pre-edit bytes,
  // and the pre-grabbed element handle stays attached (no full reload).
  test.fails('.jpg serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.jpg-fetched')
    expect(fetchedBefore).toContain('JPG-FBM-MARKER-V1')

    editFile('sample.jpg', (code) =>
      code.replace('JPG-FBM-MARKER-V1', 'JPG-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.jpg-fetched'), { timeout: 5000 })
      .toContain('JPG-FBM-MARKER-V2')
  })
}
