import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `?inline` / `?no-inline` cases in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts
//   - `test('?inline png import')` L517-521 — asserts the import is `/^data:image\/png;base64,/`
//   - `test('?no-inline svg import')` L501-507 — asserts the import is the non-inlined
//     asset URL (in build `/foo/bar/assets/fragment-<hash>.svg`; in dev the dev-server URL)
//   + playground/assets/index.html L566-573:
//     `import noInlineSvg from './nested/fragment.svg?no-inline'; text('.no-inline-svg', noInlineSvg)`
//     `import inlinePng from './nested/asset.png?inline'; text('.inline-png', inlinePng)`
//
// THE TWO SUFFIXES + WHAT WE FOUND EMPIRICALLY (both LOAD fine, both FREEZE on HMR):
//   ?inline   -> shouldInline returns TRUE  (asset.ts:546)  -> assetToDataURL  -> a
//               `data:...` URI BAKED INTO the JS module as a string. LOAD PASSES.
//               HYPOTHESIS was that, like `?raw`, the baked value would re-evaluate FRESH
//               on edit. EMPIRICALLY IT DOES NOT — the data URI FREEZES, because the asset
//               `load` branch (asset.ts:217+) NEVER calls `this.addWatchFile(file)` (only
//               the `rawRE` branch does, at asset.ts:206) AND `fileToBuiltUrl` caches the
//               URI in `assetCache` (asset.ts:445-449,487) which is only evicted by
//               `watchChange` (asset.ts:314-316) — which never fires for an unwatched file.
//               So editing the source produces NO HMR event at all and the cached data URI
//               is stale. This is WHY `?inline` differs from `?raw` despite both baking the
//               value into the JS module. HMR FAILS -> marked `test.fails`.
//   ?no-inline-> shouldInline returns FALSE (asset.ts:545)  -> emitFile        -> a real
//               emitted `/assets/...-<hash>` asset URL (even for a small file). Under FBM
//               the client env is `isBundled: true` (config.ts:952-953) so this takes the
//               BUILD emit path resolved via `toOutputFilePathInJSForBundledDev`
//               (asset.ts:476-481). LOAD PASSES. HMR FAILS: FBM's incremental HMR never
//               re-emits assets (renderChunk skipped; bundledDev.ts handleHmrOutput relays
//               JS only), so the emitted asset content FREEZES — SAME root cause as §4
//               `?url` (#22596 family). HMR -> marked `test.fails`.
//
// Both source SVGs are tiny (<4096 B) so the query suffix — NOT the size — decides
// inline-vs-emit: `?inline` inlines a 133 B file, `?no-inline` emits a 134 B file that
// would otherwise inline by size. This isolates the suffix semantics.
//
// CRITICAL METHODOLOGY: each edit needle (`INLINEMARKERALPHA` / `NOINLINEMARKERALPHA`)
// occurs EXACTLY ONCE in its SVG and the `...OMEGA` form is absent pre-edit, so the
// single-match `String.prototype.replace` in editFile provably changes the file content
// — avoiding the comment-collision artifact that made the .less/.styl/.pcss verdicts a
// test artifact.

// ---------------------------------------------------------------------------
// 1. ?inline — load (PASSES): the import is a `data:` URI baked into the JS module
//    (NOT an `/assets/...` URL), and decoding it shows the original file content
//    (the unique marker survives URL-encoding verbatim).
// ---------------------------------------------------------------------------
test('?inline loads as a data: URI under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('query-inline loaded')

  const inlineUrl = await page.textContent('.inline-value')
  // It is an inlined data URI for the SVG — NOT a real emitted asset URL, NOT a
  // dangling placeholder.
  expect(inlineUrl).toMatch(/^data:image\/svg\+xml[,;]/)
  expect(inlineUrl).not.toMatch(/\/assets\//)
  expect(inlineUrl).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
  // The data URI carries the real file content: the marker (alphanumeric -> survives
  // URL-encoding verbatim) is present, proving the bytes were inlined.
  expect(inlineUrl).toContain('INLINEMARKERALPHA')
})

// ---------------------------------------------------------------------------
// 2. ?no-inline — load (PASSES): the import is a real emitted asset URL (NOT a data
//    URI), and fetch(url) returns the real file body (the strongest resolution check —
//    catches a placeholder / 404).
// ---------------------------------------------------------------------------
test('?no-inline loads as a real emitted asset URL under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('query-inline loaded')

  const noinlineUrl = await page.textContent('.noinline-value')
  // Forced to the emitted-asset path even though the file is tiny: a real hashed
  // `/assets/noinline-<hash>.svg` URL, NOT a data URI, NOT a dangling placeholder.
  expect(noinlineUrl).not.toMatch(/^data:/)
  expect(noinlineUrl).toMatch(/\/assets\/noinline-[-\w]+\.svg/)
  expect(noinlineUrl).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)

  // Strongest resolution check: fetch(url) returns the real file body (with the marker).
  const fetched = await page.textContent('.noinline-fetched')
  expect(fetched).toContain('NOINLINEMARKERALPHA')
  expect(fetched).not.toMatch(/__ROLLDOWN_ASSET__|FETCH_FAILED|FETCH_THREW/)
})

if (!isBuild) {
  // -------------------------------------------------------------------------
  // 3. ?inline — HMR (FAILS in FBM — known gap, DISTINCT root cause from `?no-inline`):
  //    editing the source does NOT update the baked data URI. Despite the value living
  //    IN the JS module (so one might expect `?raw`-style fresh re-eval), the data URI
  //    FREEZES — the asset `load` branch never `addWatchFile`s the source (asset.ts:206
  //    is in the `rawRE` branch only), so editing it produces NO HMR event and the cached
  //    `assetCache` data URI (asset.ts:445-449,487; evicted only by watchChange,
  //    asset.ts:314-316) is never refreshed. Marked `test.fails` so the committed suite
  //    stays green while documenting the FBM gap (see RESULT.md §4 `?inline`).
  // -------------------------------------------------------------------------
  test.fails('?inline data URI reflects the UPDATED file on HMR under FBM (known fail)', async () => {
    const before = await page.textContent('.inline-value')
    expect(before).toContain('INLINEMARKERALPHA')

    editFile('inline.svg', (code) =>
      code.replace('INLINEMARKERALPHA', 'INLINEMARKEROMEGA'),
    )

    // EXPECTED (fresh re-eval): the `?inline` module re-evaluates and the data URI
    // carries the NEW marker.
    // ACTUAL (FBM): the source is unwatched -> no HMR event -> the baked data URI keeps
    // the pre-edit marker, so this poll times out -> the test "fails" as expected.
    await expect
      .poll(() => page.textContent('.inline-value'))
      .toContain('INLINEMARKEROMEGA')
  })

  // -------------------------------------------------------------------------
  // 4. ?no-inline — HMR (FAILS in FBM — known gap, SAME root cause as §4 `?url`):
  //    editing the source does NOT update what the emitted asset URL serves. The
  //    asset content is frozen at the initial value, so the fetched body keeps the
  //    pre-edit marker. Marked `test.fails` so the committed suite stays green while
  //    documenting the FBM gap (emitted-asset content not refreshed on HMR; #22596
  //    family — see RESULT.md §4 `?url`).
  // -------------------------------------------------------------------------
  test.fails('?no-inline emitted asset serves the UPDATED file on HMR under FBM (known fail)', async () => {
    const before = await page.textContent('.noinline-fetched')
    expect(before).toContain('NOINLINEMARKERALPHA')

    editFile('noinline.svg', (code) =>
      code.replace('NOINLINEMARKERALPHA', 'NOINLINEMARKEROMEGA'),
    )

    // EXPECTED (Vite semantics): the emitted asset reflects the edited file, so the
    // fetched body contains the new marker.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit marker, so this poll
    // times out -> the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.noinline-fetched'))
      .toContain('NOINLINEMARKEROMEGA')
  })
}
