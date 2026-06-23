import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's static-asset URL-import case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts ("asset imports from js" ->
//   `test('relative')` lines 131-133, asserting the imported URL matches the served
//   asset URL shape `assetMatch` lines 21-23) + playground/assets/index.html
//   (lines 501-502, `import url from './nested/asset.png'; text('.asset-import-relative', url)`).
//
// `.vtt` is the LAST media entry in `KNOWN_ASSET_TYPES` (constants.ts:174, directly
// after `'m4a'` :173 / `'mov'` :172 / `'opus'` :171 under the `// media` comment :163),
// handled by the SAME extension-keyed asset pipeline as `.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import vttUrl from './sample.vtt'` returns a URL STRING. `sample.vtt` is >4096 B,
// so it takes the EMITTED-asset path (a real hashed `/assets/sample-<hash>.vtt`), not
// the small-file inline `data:` URI path (the >4096 B path is the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac` / `.opus` / `.mov` / `.m4a`).
//
// `.vtt` (WebVTT subtitles) is genuine text; the file holds VALID WebVTT (a `WEBVTT`
// header + cues) AND a UNIQUE single-occurrence needle (`VTT-FBM-MARKER-V1`) so the spec
// can assert the served bytes via fetch() and edit them cleanly. The asset pipeline is
// extension-keyed (not content-validating), so the bytes flow through the identical pipeline.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (expected PASS): the import is a URL string that genuinely resolves
  //    to the asset — a real hashed `/assets/sample-<hash>.vtt`, NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder — and fetch(url) returns the
  //    known asset bytes.
  test('.vtt import resolves to a real served asset URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('vtt loaded')

    const url = await page.textContent('.vtt-url')
    // Real emitted asset URL (>4096 B → not inlined as a data URI).
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.vtt/)
    // NOT an unresolved placeholder, NOT a data URI (would mean it was inlined).
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).not.toMatch(/^data:/)

    // Strongest resolution check: fetch(url) returns the real asset bytes.
    const fetched = await page.textContent('.vtt-fetched')
    expect(fetched).toContain('VTT-FBM-MARKER-V1')
    expect(fetched).not.toMatch(/FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same as CSS `?url` / the image cluster / `.mp4` / `.webm` / `.ogg` / `.mp3` / `.wav` / `.flac` / `.aac` / `.opus` / `.mov` / `.m4a`):
  //    editing the asset's bytes does NOT update what the emitted URL serves. The emitted
  //    asset content is FROZEN at the initial value (the URL hash does not change either),
  //    so fetch(url) keeps returning the pre-edit bytes; there is no full reload. Marked
  //    `test.fails` so the committed suite stays green while documenting the FBM gap (see
  //    RESULT.md ".m4a" / ".mov" / ".opus" / ".aac" / ".flac" / ".wav" / ".mp3" / ".ogg" /
  //    ".webm" / ".mp4" / ".jxl" / ".png" / "CSS `?url`" — emitted-asset content is not re-emitted on HMR; #22596 family).
  //
  // Expected empirically under FBM: URL before/after = `/assets/sample-<hash>.vtt`
  // (UNCHANGED), a fresh fetch returns 200 with the STALE pre-edit bytes, and there is
  // no full reload.
  test.fails('.vtt serves the UPDATED bytes after an HMR edit under FBM (known fail)', async () => {
    const fetchedBefore = await page.textContent('.vtt-fetched')
    expect(fetchedBefore).toContain('VTT-FBM-MARKER-V1')

    editFile('sample.vtt', (code) =>
      code.replace('VTT-FBM-MARKER-V1', 'VTT-FBM-MARKER-V2'),
    )

    // EXPECTED (Vite semantics): the served asset reflects the edited bytes.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit bytes, so this poll
    // times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.vtt-fetched'), { timeout: 5000 })
      .toContain('VTT-FBM-MARKER-V2')
  })
}
