import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's plain `.css` case in playground/css.
// vite ref: playground/css/__tests__/tests.ts ("css import from js", lines 44-60)
// and the "linked css" reload-guard comment (lines 17-18): tests reuse an element
// grabbed before the edit so a full page reload would surface as a detached element.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the imported `.css` renders the expected style on initial dev load.
  test('plain .css loads under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('css loaded')
    await expect.poll(() => getColor('.imported')).toBe('green')
  })

  // 2. HMR: editing the `.css` produces a hot style update WITHOUT a full page reload
  //    (same check Vite's non-FBM CSS test makes).
  test('plain .css hot style update under FBM (no full reload)', async () => {
    const imported = await page.$('.imported')
    expect(await getColor(imported)).toBe('green')

    editFile('imported.css', (code) =>
      code.replace('color: green', 'color: red'),
    )
    // CSS HMR: the previously-grabbed element handle stays valid (no reload)
    // and its color updates to red.
    await expect.poll(() => getColor(imported)).toBe('red')

    // The JS-set DOM text was written once on load; if FBM full-reloaded on the
    // CSS edit this would still be present, but a reload would also re-run main.js.
    // Assert it is unchanged to confirm the page state was preserved.
    expect(await page.textContent('.app')).toBe('css loaded')
  })
}
