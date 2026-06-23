import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's CSS `?url` case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('?url')`, lines 403-405 —
//   `getColor('.url-imported-css')` is `yellow`, i.e. the URL resolves to the
//   PROCESSED CSS and the rule applies via a <link>) + playground/css/main.js
//   (lines 11-12, `import urlCss from './url-imported.css?url'`,
//   `appendLinkStylesheet(urlCss)`).
//
// `?url` returns a URL STRING pointing at the processed CSS file (NOT injected as a
// `<style>`, NOT the raw contents). Vite's test injects the URL as a
// `<link rel="stylesheet" href={urlCss}>` and asserts the styled color is `yellow`,
// which proves the URL actually resolves to the served, processed CSS.
//
// This port keeps that styled-color assertion AND adds the strongest possible
// resolution check — `fetch(urlCss)` and assert the served body is the real CSS —
// which is exactly what would catch an unresolved asset-URL placeholder under FBM.
//
// IMPORTANT — `?url` under FBM takes the BUILD asset path, not Vite's dev asset path:
//   In FBM the client environment is `isBundled: true` (config.ts:952-953), so
//   `fileToUrl` (asset.ts:326-330) routes `*.css?url` through `fileToBuiltUrl` (the
//   BUILD path) instead of `fileToDevUrl`. So the URL is NOT Vite's dev `/url.css?url`
//   server URL — it is an emitted hashed asset `/assets/url-<hash>.css` (files over the
//   4096 B inline limit) or a `data:text/css;base64,…` URI (small files). Both forms
//   genuinely RESOLVE to the processed CSS on initial load (the `__ROLLDOWN_ASSET__`
//   placeholder is resolved here, NOT shipped dangling like vitejs/vite#22596). This
//   port uses a >4096 B `url.css` to exercise the emitted-asset path (the asset-URL
//   path the FBM milestone cares about), not the trivial inline-data-URI path.
//
// Reload-guard (same pattern as the `.css` / `?inline` / `?raw` ports, tests.ts
// lines 17-18): the `.url-imported-css` element handle is grabbed BEFORE the edit, so
// a full page reload would detach it.
//
// CRITICAL METHODOLOGY: the edit string `color: yellow` occurs EXACTLY ONCE in
// url.css (the real rule on line 2; the padding rules use only margin/padding, no
// comment carries the token), so the single-match `String.prototype.replace` in
// editFile provably changes the rendered declaration — this avoids the comment-
// collision artifact that made the .less/.styl/.pcss "stale" verdicts a test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve (PASSES): the `?url` import is a URL string that genuinely
  //    resolves to the PROCESSED CSS — asserted three ways: the styled color is
  //    yellow (Vite's own assertion), fetch(url) returns the processed CSS body, and
  //    the URL is a real resolving asset URL (hashed `/assets/…` here), NOT an
  //    unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder.
  test('CSS ?url loads as a resolving URL under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('css-url loaded')

    // Vite's own assertion: the URL resolves to the processed CSS and the rule applies
    // via the injected <link> (a dangling/placeholder URL or 404 would leave
    // `.url-imported-css` unstyled).
    await expect.poll(() => getColor('.url-imported-css')).toBe('yellow')

    // Strongest resolution check: fetch(url) returns the real processed CSS body.
    const fetched = await page.textContent('.url-fetched')
    expect(fetched).toContain('.url-imported-css')
    expect(fetched).toContain('color: yellow')
    expect(fetched).not.toMatch(/__ROLLDOWN_ASSET__|FETCH_FAILED|FETCH_THREW/)

    // The URL resolves to a real served asset URL — NOT an unresolved placeholder.
    const url = await page.textContent('.url-value')
    expect(url).not.toMatch(/__ROLLDOWN_ASSET__|__VITE_ASSET__/)
  })

  // 2. HMR (FAILS in FBM — known gap): editing the `.css` does NOT update what the
  //    `?url` URL serves. The emitted asset content is frozen at the initial value, so
  //    the styled color and the fetched body keep the pre-edit CSS. Marked `test.fails`
  //    so the committed suite stays green while documenting the FBM gap (see RESULT.md
  //    "CSS `?url`" — emitted-asset content is not refreshed on HMR).
  test.fails('CSS ?url resolves to the UPDATED CSS on HMR under FBM (known fail)', async () => {
    const urlEl = await page.$('.url-imported-css')
    expect(await getColor(urlEl)).toBe('yellow')

    editFile('url.css', (code) => code.replace('color: yellow', 'color: red'))

    // EXPECTED (Vite semantics): the URL keeps resolving — now to the edited CSS.
    // ACTUAL (FBM): the emitted asset still serves the pre-edit `color: yellow`, so
    // this poll times out → the test "fails" as expected, documenting the gap.
    await expect
      .poll(() => page.textContent('.url-fetched'))
      .toContain('color: red')
  })
}
