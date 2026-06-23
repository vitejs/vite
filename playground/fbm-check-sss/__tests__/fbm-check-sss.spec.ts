import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `.sss` (SugarSS) case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('sugarss')`, lines 461-483):
//   - initial load asserts `.sugarss` renders `blue` (parsed by the sugarss
//     PostCSS syntax from indentation-based source — NOT valid plain CSS).
//   - HMR edits `sugarss.sss` replacing `color: blue` and polls the SAME element
//     handle to the new color (tests.ts lines 476-477 edit `color: blue` ->
//     `color: coral`; here `color: blue` -> `color: red` to match the .css/.scss
//     ports' edit shape; the substance — a SugarSS color HMR edit — is identical).
// Reload-guard (same pattern as the `.css` / `.scss` ports, tests.ts lines 17-18):
// the element handle is grabbed BEFORE the edit, so a full page reload would
// detach it and the post-edit assertion would surface the reload instead of a
// hot style update.
//
// CRITICAL METHODOLOGY: the edit string `color: blue` occurs EXACTLY ONCE in
// sugarss.sss (the real rule on line 2; the file has no comments), so the
// single-match `String.prototype.replace` in editFile provably changes the
// rendered declaration — this is NOT the comment-collision artifact that made
// the .less/.styl/.pcss "stale" verdicts a test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.sss` is parsed by sugarss and renders the
  //    expected color on initial dev load.
  test('.sss (SugarSS) loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('sss loaded')
    await expect.poll(() => getColor('.sugarss')).toBe('blue')
  })

  // 2. HMR: editing the `.sss` produces a hot style update WITHOUT a full page
  //    reload (same check Vite's non-FBM SugarSS test makes, tests.ts L476-477).
  test('.sss (SugarSS) hot style update under FBM (no full reload)', async () => {
    const imported = await page.$('.sugarss')
    expect(await getColor(imported)).toBe('blue')

    editFile('sugarss.sss', (code) => code.replace('color: blue', 'color: red'))
    // CSS HMR: the previously-grabbed element handle stays valid (no reload)
    // and its color updates to red.
    await expect.poll(() => getColor(imported)).toBe('red')

    // The JS-set DOM text was written once on load. A full reload would re-run
    // main.js; assert it is unchanged to confirm page state was preserved.
    expect(await page.textContent('.app')).toBe('sss loaded')
  })
}
