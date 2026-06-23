import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `?url&inline` / `?url&no-inline` query-suffix COMBINATIONS.
// vite ref: playground/assets/__tests__/assets.spec.ts
//   - `?url&inline`   -> `test('?inline public json import')` L529-533 — the EXACT `?url&inline`
//     combo (`import inlinePublicJson from '/foo.json?url&inline'`, index.html L578-579),
//     asserted to be `/^data:application\/json;base64,/` (a data URI: the inline wins).
//   - `?url&no-inline` -> Vite has NO exact `?url&no-inline` test; the closest real cases are
//     `test('?no-inline svg import')` L501-507 (the non-inlined asset URL) and
//     `test('?url import')` L535-542. We port the closest: `?url&no-inline` forces the emitted
//     `/assets/...-<hash>` URL path even for a tiny file.
//
// THE TWO COMBOS + WHAT WE FOUND EMPIRICALLY (both LOAD fine, both FREEZE on HMR) — these
// behave IDENTICALLY to the plain `?inline` / `?no-inline` cases (RESULT.md §4
// `?inline` / `?no-inline`), because `?url` is REDUNDANT: `?inline`/`?no-inline` already
// route through the asset/url branch (asset.ts:217-243), the same branch `?url` carries to.
//   ?url&inline   -> `urlRE` matches `?url` -> asset/url branch (asset.ts:217-243, which never
//               calls `this.addWatchFile`). `fileToUrl`->`fileToBuiltUrl`->`shouldInline`:
//               `inlineRE` -> TRUE (asset.ts:546, before the size check) -> `assetToDataURL`
//               -> a `data:` URI BAKED INTO the JS module. LOAD PASSES. HMR FAILS — the data
//               URI FREEZES, SAME root cause as §4 `?inline`: the asset `load` branch never
//               `addWatchFile`s the source (only the `rawRE` branch does, asset.ts:206) AND
//               `fileToBuiltUrl` caches the URI in `assetCache` (asset.ts:445-449,487; evicted
//               only by `watchChange`, asset.ts:314-316, which never fires for an unwatched
//               file). So editing the source produces NO HMR event and the cached data URI is
//               stale. HMR -> marked `test.fails`.
//   ?url&no-inline -> same asset/url branch, `shouldInline`: `noInlineRE` -> FALSE
//               (asset.ts:545) -> `emitFile` -> a real emitted `/assets/...-<hash>` URL even
//               for a tiny file. Under FBM the client env is `isBundled: true`
//               (config.ts:952-953) so this takes the BUILD emit path resolved via
//               `toOutputFilePathInJSForBundledDev` (asset.ts:476-481). LOAD PASSES. HMR
//               FAILS: FBM's incremental HMR never re-emits assets (renderChunk skipped;
//               bundledDev.ts handleHmrOutput relays JS only), so the emitted asset content
//               FREEZES — SAME root cause as §4 `?url` / `?no-inline` (#22596 family).
//               HMR -> marked `test.fails`.
//
// Both source SVGs are tiny (<4096 B) so the query suffix — NOT the size — decides
// inline-vs-emit: `?url&inline` inlines a 135 B file, `?url&no-inline` emits a 136 B file
// that would otherwise inline by size. This isolates the suffix semantics.
//
// CRITICAL METHODOLOGY: each edit needle (`URLINLINEMARKERALPHA` / `URLNOINLINEMARKERALPHA`)
// occurs EXACTLY ONCE in its SVG and the `...OMEGA` form is absent pre-edit, so the
// single-match `String.prototype.replace` in editFile provably changes the file content —
// avoiding the comment-collision artifact that made the .less/.styl/.pcss verdicts a test
// artifact.

// ---------------------------------------------------------------------------
// 1. ?url&inline — load (PASSES): the import is a `data:` URI baked into the JS module
//    (the inline WINS over url — NOT an `/assets/...` URL), and decoding it shows the
//    original file content (the unique marker survives URL-encoding verbatim).
// ---------------------------------------------------------------------------
test('?url&inline loads as a data: URI under FBM (bundledDev)', async () => {
  await expect
    .poll(() => page.textContent('.app'))
    .toBe('query-url-inline loaded')

  const a = await page.textContent('.urlinline-value')
  // It is an inlined data URI for the SVG — NOT a real emitted asset URL, NOT a dangling
  // placeholder. The `&inline` wins over the `?url` form.
  expect(a).toMatch(/^data:image\/svg\+xml[,;]/)
  expect(a).not.toMatch(/\/assets\//)
  expect(a).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
  // The data URI carries the real file content: the marker (alphanumeric -> survives
  // URL-encoding verbatim) is present, proving the bytes were inlined.
  expect(a).toContain('URLINLINEMARKERALPHA')
})

// ---------------------------------------------------------------------------
// 2. ?url&no-inline — load (PASSES): the import is a real emitted asset URL (NOT a data
//    URI), and fetch(url) returns the real file body (the strongest resolution check —
//    catches a placeholder / 404).
// ---------------------------------------------------------------------------
test('?url&no-inline loads as a real emitted asset URL under FBM (bundledDev)', async () => {
  await expect
    .poll(() => page.textContent('.app'))
    .toBe('query-url-inline loaded')

  const b = await page.textContent('.urlnoinline-value')
  // Forced to the emitted-asset path even though the file is tiny: a real hashed
  // `/assets/urlnoinline-<hash>.svg` URL, NOT a data URI, NOT a dangling placeholder.
  expect(b).not.toMatch(/^data:/)
  expect(b).toMatch(/\/assets\/urlnoinline-[-\w]+\.svg/)
  expect(b).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)

  // Strongest resolution check: fetch(url) returns the real file body (with the marker).
  const fetched = await page.textContent('.urlnoinline-fetched')
  expect(fetched).toContain('URLNOINLINEMARKERALPHA')
  expect(fetched).not.toMatch(/__ROLLDOWN_ASSET__|FETCH_FAILED|FETCH_THREW/)
})

if (!isBuild) {
  // -------------------------------------------------------------------------
  // 3. ?url&inline — HMR (FAILS in FBM — known gap, SAME root cause as §4 `?inline`):
  //    editing the source does NOT update the baked data URI. Despite the value living
  //    IN the JS module, the data URI FREEZES — the asset `load` branch never
  //    `addWatchFile`s the source (asset.ts:206 is in the `rawRE` branch only), so editing
  //    it produces NO HMR event and the cached `assetCache` data URI (asset.ts:445-449,487;
  //    evicted only by watchChange, asset.ts:314-316) is never refreshed. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md §4 `?inline`).
  // -------------------------------------------------------------------------
  test.fails('?url&inline data URI reflects the UPDATED file on HMR under FBM (known fail)', async () => {
    const before = await page.textContent('.urlinline-value')
    expect(before).toContain('URLINLINEMARKERALPHA')

    editFile('urlinline.svg', (code) =>
      code.replace('URLINLINEMARKERALPHA', 'URLINLINEMARKEROMEGA'),
    )

    // EXPECTED (fresh re-eval): the `?url&inline` module re-evaluates and the data URI
    // carries the NEW marker.
    // ACTUAL (FBM): the source is unwatched -> no HMR event -> the baked data URI keeps
    // the pre-edit marker, so this poll times out -> the test "fails" as expected.
    await expect
      .poll(() => page.textContent('.urlinline-value'))
      .toContain('URLINLINEMARKEROMEGA')
  })

  // -------------------------------------------------------------------------
  // 4. ?url&no-inline — HMR (FAILS in FBM — known gap, SAME root cause as §4 `?url`):
  //    editing the source does NOT update what the emitted asset URL serves. The asset
  //    content is frozen at the initial value, so the fetched body keeps the pre-edit
  //    marker. Marked `test.fails` so the committed suite stays green while documenting the
  //    FBM gap (emitted-asset content not refreshed on HMR; #22596 family — see RESULT.md
  //    §4 `?url`).
  // -------------------------------------------------------------------------
  test.fails('?url&no-inline emitted asset serves the UPDATED file on HMR under FBM (known fail)', async () => {
    const before = await page.textContent('.urlnoinline-fetched')
    expect(before).toContain('URLNOINLINEMARKERALPHA')

    editFile('urlnoinline.svg', (code) =>
      code.replace('URLNOINLINEMARKERALPHA', 'URLNOINLINEMARKEROMEGA'),
    )

    // EXPECTED (Vite semantics): the emitted asset reflects the edited file, so the
    // fetched body contains the new marker.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit marker, so this poll
    // times out -> the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.urlnoinline-fetched'))
      .toContain('URLNOINLINEMARKEROMEGA')
  })
}
