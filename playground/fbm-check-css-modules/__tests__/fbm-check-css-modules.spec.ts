import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's CSS Modules case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('css modules')`, L166-182):
//   - the `*.module.css` import returns a class-name MAP; the mapped class is a
//     hashed name (format `mod-module__apply-color___[hash]`, tests.ts L172-174)
//     applied to `.modules`, which therefore renders the rule's color (turquoise).
//   - HMR edits `mod.module.css` replacing `color: turquoise` with `color: red`
//     and polls the SAME element handle to `red` (tests.ts L178-181).
// Reload-guard (same pattern as the `.css`/`.scss` ports / tests.ts L17-18): the
// element handle is grabbed BEFORE the edit, so a full page reload would detach
// it and the post-edit assertion would surface the reload instead of a hot update.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve — BOTH halves Vite asserts:
  //    (a) the class-map resolves to a HASHED class name (not the raw local
  //        `apply-color`), matching the `[name]__[local]___[hash]` format; and
  //    (b) that mapped class is applied so the element renders the module's color.
  test('CSS Modules class-map resolves + styles under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('css-modules loaded')

    const imported = await page.$('.modules')

    // (b) the mapped class actually takes effect — element is turquoise.
    expect(await getColor(imported)).toBe('turquoise')

    // (a) the resolved class is the hashed module name, NOT the raw `apply-color`.
    //     Same regex shape Vite's test asserts (tests.ts L172-174).
    const cls = await imported.getAttribute('class')
    expect(cls).toMatch(/mod-module__apply-color___[\w-]{5}/)
    expect(cls).not.toBe('apply-color')

    // The map is a real object whose `apply-color` maps to the hashed name.
    const code = await page.textContent('.modules-code')
    const mapValue = JSON.parse(code)['apply-color']
    expect(mapValue).toMatch(/mod-module__apply-color___[\w-]{5}/)
  })

  // 2. HMR: editing the `.module.css` produces a hot style update WITHOUT a full
  //    page reload (same check Vite's non-FBM test makes, tests.ts L178-181).
  test('CSS Modules hot style update under FBM (no full reload)', async () => {
    const imported = await page.$('.modules')
    expect(await getColor(imported)).toBe('turquoise')

    // `color: turquoise` occurs EXACTLY ONCE in mod.module.css (the real rule,
    // no comment carries the token), so this single-match replace provably edits
    // the rendered declaration — not a comment (cf. the .less/.pcss collision bug).
    editFile('mod.module.css', (code) =>
      code.replace('color: turquoise', 'color: red'),
    )

    // CSS HMR: the previously-grabbed element handle stays valid (no reload)
    // and its color updates to red.
    await expect.poll(() => getColor(imported)).toBe('red')

    // The JS-set DOM text was written once on load. A full reload would re-run
    // main.js; assert it is unchanged to confirm page state was preserved.
    expect(await page.textContent('.app')).toBe('css-modules loaded')
  })
}
