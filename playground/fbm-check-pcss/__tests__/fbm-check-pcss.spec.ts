import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's PostCSS case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('postcss config', ...)`,
// lines 68-76):
//   - initial load asserts `.postcss .nesting` renders `pink` — the color only
//     applies because the `postcss-nested` PostCSS plugin FLATTENED the nested
//     `.postcss { .nesting { color: pink } }` rule at transform time (a genuine
//     PostCSS transform, not something plain CSS injection does on its own).
//   - HMR edits the CSS replacing `color: pink` with `color: red` and polls the
//     SAME element handle to `red` (tests.ts lines 74-75).
// Reload-guard (same pattern as the `.css` / `.scss` / `.less` / `.styl` ports,
// tests.ts lines 17-18): the element handle is grabbed BEFORE the edit, so a
// full page reload would detach it and the post-edit assertion would surface
// the reload instead of a hot style update.
//
// NOTE: `.pcss`/`.postcss` are NOT a worker-based preprocessor language (unlike
// Sass/Less/Stylus). They are CSS run through PostCSS inline inside `compileCSS`
// — a DISTINCT stage from the preprocessor worker path. So whether the FBM HMR
// patch ships stale or fresh CSS is determined empirically below, not assumed
// to match `.less` (stale) or `.scss` (fresh).
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.pcss` is processed by `postcss-nested`
  //    (which flattens the nested rule) and renders the expected color on the
  //    child element on initial dev load.
  test('.pcss (PostCSS) loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('pcss loaded')
    await expect.poll(() => getColor('.postcss .nesting')).toBe('pink')
  })

  // 2. HMR: editing the `.pcss` SHOULD produce a hot style update WITHOUT a full
  //    page reload (same check Vite's non-FBM PostCSS test makes, tests.ts
  //    L74-75): re-run PostCSS and ship the recompiled CSS.
  //
  // KNOWN FBM FAILURE — same stale-content root cause as `.less` / `.styl`
  // (see RESULT.md). On a CSS edit, FBM's HMR patch re-emits CSS produced from
  // the STALE pre-edit source: the captured `hmr_patch_0.js` ships
  // `__vite__css = ".postcss .nesting {\n    color: pink;\n  }\n"` — the
  // selector IS flattened (so PostCSS `postcss-nested` ran), but on the
  // ORIGINAL bytes, so the color stays `pink`. `.scss`/`.css` recompile
  // correctly under FBM (their patches carry the fresh post-edit CSS). PostCSS
  // runs at a DISTINCT Vite stage from the Sass/Less/Stylus preprocessor
  // workers (inline in `compileCSS`), but the staleness enters UPSTREAM of both
  // — in the Rolldown `load`→`transform` content handoff for the changed CSS
  // module on HMR re-fetch — so the symptom matches `.less` exactly.
  // Marked `test.fails` so the committed suite stays green while documenting it.
  test.fails('.pcss (PostCSS) hot style update under FBM (no full reload) — KNOWN FBM FAILURE: HMR patch ships stale pre-edit CSS (same root cause as .less)', async () => {
    const imported = await page.$('.postcss .nesting')
    expect(await getColor(imported)).toBe('pink')

    editFile('nested.pcss', (code) => code.replace('color: pink', 'color: red'))
    // EXPECTED (and what css/scss do under FBM): the previously-grabbed handle
    // stays valid (no reload) and its color updates to red. ACTUAL under FBM:
    // stays `pink` because the patch's compiled CSS is stale — this poll times
    // out, so `test.fails` passes while the bug exists.
    await expect.poll(() => getColor(imported)).toBe('red')

    // A full reload would re-run main.js; the JS-set text is unchanged,
    // confirming the failure is a stale patch, not a page reload.
    expect(await page.textContent('.app')).toBe('pcss loaded')
  })
}
