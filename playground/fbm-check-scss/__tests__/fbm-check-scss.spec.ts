import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `.scss` (Sass) case in playground/css.
// vite ref: playground/css/__tests__/sass-tests.ts (`sassTest`, lines 5-78):
//   - initial load asserts `.sass` renders `orange` (compiled from `color: $injectedColor`)
//   - HMR edits `sass.scss` replacing `color: $injectedColor` with `color: red`
//     and polls the SAME element handle to `red` (sass-tests.ts lines 64-67).
// Reload-guard (same pattern as the `.css` port / tests.ts lines 17-18): the element
// handle is grabbed BEFORE the edit, so a full page reload would detach it and the
// post-edit assertion would surface the reload instead of a hot style update.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.scss` is compiled by Sass and renders the
  //    expected color on initial dev load.
  test('.scss (Sass) loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('scss loaded')
    await expect.poll(() => getColor('.sass')).toBe('orange')
  })

  // 2. HMR: editing the `.scss` produces a hot style update WITHOUT a full page
  //    reload (same check Vite's non-FBM Sass test makes, sass-tests.ts L64-67).
  test('.scss (Sass) hot style update under FBM (no full reload)', async () => {
    const imported = await page.$('.sass')
    expect(await getColor(imported)).toBe('orange')

    editFile('sass.scss', (code) =>
      code.replace('color: $injectedColor', 'color: red'),
    )
    // CSS HMR: the previously-grabbed element handle stays valid (no reload)
    // and its color updates to red.
    await expect.poll(() => getColor(imported)).toBe('red')

    // The JS-set DOM text was written once on load. A full reload would re-run
    // main.js; assert it is unchanged to confirm page state was preserved.
    expect(await page.textContent('.app')).toBe('scss loaded')
  })
}
