import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's GENERAL (non-CSS) `?url` case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts (`test('?url import')`,
//   lines 535-542 — imports `./foo.js?url` and asserts `.url` text is the resolved
//   URL for foo.js: a data URI in build, the dev server URL `/foo/bar/foo.js` in dev)
//   + playground/assets/index.html (lines 581-582,
//   `import fooUrl from './foo.js?url'; text('.url', fooUrl)`).
//
// `?url` returns a URL STRING pointing at the file (NOT its contents, NOT its
// evaluated module). Vite's test asserts the rendered URL matches the served file
// URL, which proves the URL resolves. This port keeps that resolution check AND adds
// the strongest possible check — `fetch(url)` and assert the served body is the real
// file content — which is exactly what would catch an unresolved asset-URL placeholder
// under FBM.
//
// IMPORTANT — a NON-CSS `?url` under FBM takes the BUILD asset path, not Vite's dev
// asset path (identical mechanism to CSS `?url`):
//   In FBM the client environment is `isBundled: true` (config.ts:952-953), so
//   `fileToUrl` (asset.ts:326-330) routes the `?url` request through `fileToBuiltUrl`
//   (the BUILD path) instead of `fileToDevUrl`. So the URL is NOT Vite's dev
//   `/sample.js?url` server URL — for a file over the 4096 B inline limit it is an
//   emitted hashed asset `/assets/sample-<hash>.js` (asset.ts:476-481, 491-510 via
//   `toOutputFilePathInJSForBundledDev`); for a small file it would be a
//   `data:text/javascript;base64,…` URI (asset.ts:455-458). Both forms genuinely
//   RESOLVE on initial load (the `__ROLLDOWN_ASSET__` placeholder is resolved here, NOT
//   shipped dangling). This port uses a >4096 B `sample.js` to exercise the
//   emitted-asset path (where the HMR freeze occurs), not the trivial inline path.
//
// CRITICAL METHODOLOGY: the edit needle `MARKER_ALPHA` occurs EXACTLY ONCE in
// sample.js (the real marker; the padding entries never contain it, and `MARKER_OMEGA`
// is absent pre-edit), so the single-match `String.prototype.replace` in editFile
// provably changes the file content — this avoids the comment-collision artifact that
// made the .less/.styl/.pcss "stale" verdicts a test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (PASSES): the `?url` import is a URL string that genuinely
  //    resolves to the real file — asserted two ways: the URL is a real resolving
  //    asset URL (hashed `/assets/…` here), NOT an unresolved
  //    `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder, and fetch(url) returns the
  //    real file body (containing the unique marker).
  test('non-CSS ?url loads as a resolving URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('query-url loaded')

    // The URL resolves to a real served asset URL — NOT an unresolved placeholder.
    const url = await page.textContent('.url-value')
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
    expect(url).toMatch(/\/assets\/sample-[-\w]+\.js/)

    // Strongest resolution check: fetch(url) returns the real file body, which
    // contains the unique marker. A placeholder/404 would not contain it.
    const fetched = await page.textContent('.url-fetched')
    expect(fetched).toContain('MARKER_ALPHA')
    expect(fetched).not.toMatch(/__ROLLDOWN_ASSET__|FETCH_FAILED|FETCH_THREW/)
  })

  // 2. HMR (FAILS in FBM — known gap, same root cause as CSS `?url`): editing the
  //    file does NOT update what the `?url` URL serves. The emitted asset content is
  //    frozen at the initial value, so the fetched body keeps the pre-edit marker.
  //    Marked `test.fails` so the committed suite stays green while documenting the FBM
  //    gap (see RESULT.md "§4 `?url`" — emitted-asset content is not refreshed on HMR;
  //    same #22596-family root cause as CSS `?url`).
  test.fails('non-CSS ?url resolves to the UPDATED file on HMR under FBM (known fail)', async () => {
    const before = await page.textContent('.url-fetched')
    expect(before).toContain('MARKER_ALPHA')

    editFile('sample.js', (code) =>
      code.replace('MARKER_ALPHA', 'MARKER_OMEGA'),
    )

    // EXPECTED (Vite semantics): the URL keeps resolving — now to the edited file,
    // so the fetched body contains the new marker.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit `MARKER_ALPHA`, so
    // this poll times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.url-fetched'))
      .toContain('MARKER_OMEGA')
  })
}
