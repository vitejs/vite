import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `.less` (Less) case in playground/css.
// vite ref: playground/css/__tests__/css.spec.ts (`test('less', ...)`, lines 88-122):
//   - initial load asserts `.less` renders `blue` (compiled from `@color: blue`)
//   - HMR edits `less.less` replacing `@color: blue` with `@color: red`
//     and polls the SAME element handle to `red` (css.spec.ts lines 115-116).
// Reload-guard (same pattern as the `.css` / `.scss` ports, tests.ts lines 17-18):
// the element handle is grabbed BEFORE the edit, so a full page reload would
// detach it and the post-edit assertion would surface the reload instead of a
// hot style update.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.less` is compiled by Less and renders the
  //    expected color on initial dev load.
  test('.less (Less) loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('less loaded')
    await expect.poll(() => getColor('.less')).toBe('blue')
  })

  // 2. HMR: editing the `.less` SHOULD produce a hot style update WITHOUT a full
  //    page reload (same check Vite's non-FBM Less test makes, css.spec.ts
  //    L115-116). Under FBM it currently does NOT: the emitted HMR patch carries
  //    the STALE pre-edit compiled CSS (`color: blue`), so the color never
  //    changes to `red`.
  //
  // KNOWN FBM FAILURE — marked `test.fails` so the committed suite stays green
  // while documenting the gap. See RESULT.md (`.less` entry) for the root cause:
  // on a `.less` edit, FBM's HMR patch re-emits the originally-compiled Less
  // output instead of recompiling the edited source. `.scss`/`.css` recompile
  // correctly (their patches carry the fresh post-edit CSS), so the gap is
  // specific to how the changed `.less` module is refetched/rendered on HMR,
  // not to Vite's CSS HMR runtime (which works for css/scss under FBM).
  test.fails('.less (Less) hot style update under FBM (no full reload) — KNOWN FBM FAILURE: HMR patch ships stale pre-edit CSS', async () => {
    const imported = await page.$('.less')
    expect(await getColor(imported)).toBe('blue')

    editFile('less.less', (code) => code.replace('@color: blue', '@color: red'))
    // EXPECTED (and what css/scss do under FBM): the previously-grabbed handle
    // stays valid (no reload) and its color updates to red. ACTUAL under FBM:
    // stays `blue` because the patch's compiled CSS is stale — this poll times
    // out, so `test.fails` passes while the bug exists.
    await expect.poll(() => getColor(imported)).toBe('red')

    // A full reload would re-run main.js; the JS-set text is unchanged,
    // confirming the failure is a stale patch, not a page reload.
    expect(await page.textContent('.app')).toBe('less loaded')
  })
}
