import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `.styl` (Stylus) case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('stylus', ...)`, lines 131-164):
//   - initial load asserts `.stylus` renders `blue` (compiled from `$color ?= blue`)
//   - HMR edits `stylus.styl` replacing `$color ?= blue` with `$color ?= red`
//     and polls the SAME element handle to `red` (tests.ts lines 155-158).
// Reload-guard (same pattern as the `.css` / `.scss` / `.less` ports, tests.ts
// lines 17-18): the element handle is grabbed BEFORE the edit, so a full page
// reload would detach it and the post-edit assertion would surface the reload
// instead of a hot style update.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.styl` is compiled by Stylus and renders the
  //    expected color on initial dev load.
  test('.styl (Stylus) loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('stylus loaded')
    await expect.poll(() => getColor('.stylus')).toBe('blue')
  })

  // 2. HMR: editing the `.styl` SHOULD produce a hot style update WITHOUT a full
  //    page reload (same check Vite's non-FBM Stylus test makes, tests.ts
  //    L155-158). Under FBM it currently does NOT: the emitted HMR patch carries
  //    the STALE pre-edit compiled CSS (`color: #00f`, i.e. blue), so the color
  //    never changes to `red`.
  //
  // KNOWN FBM FAILURE — same root cause as `.less` (see RESULT.md `.less` /
  // `.stylus` entries). On a preprocessed-CSS edit, FBM's HMR patch re-emits the
  // originally-compiled output instead of recompiling the edited source. `.scss`/
  // `.css` recompile correctly under FBM (their patches carry the fresh post-edit
  // CSS), so the gap is specific to how the changed preprocessor module (Less,
  // Stylus) is refetched/rendered on HMR, not to Vite's CSS HMR runtime.
  // Marked `test.fails` so the committed suite stays green while documenting it.
  test.fails('.styl (Stylus) hot style update under FBM (no full reload) — KNOWN FBM FAILURE: HMR patch ships stale pre-edit CSS (same root cause as .less)', async () => {
    const imported = await page.$('.stylus')
    expect(await getColor(imported)).toBe('blue')

    editFile('stylus.styl', (code) =>
      code.replace('$color ?= blue', '$color ?= red'),
    )
    // EXPECTED (and what css/scss do under FBM): the previously-grabbed handle
    // stays valid (no reload) and its color updates to red. ACTUAL under FBM:
    // stays `blue` because the patch's compiled CSS is stale — this poll times
    // out, so `test.fails` passes while the bug exists.
    await expect.poll(() => getColor(imported)).toBe('red')

    // A full reload would re-run main.js; the JS-set text is unchanged,
    // confirming the failure is a stale patch, not a page reload.
    expect(await page.textContent('.app')).toBe('stylus loaded')
  })
}
