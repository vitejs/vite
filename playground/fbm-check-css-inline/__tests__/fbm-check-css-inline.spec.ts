import { expect, test } from 'vitest'
import { editFile, getColor, isBuild, page } from '~utils'

// Faithful FBM port of Vite's CSS `?inline` case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('inlined')`, lines 376-379;
//   `test('inlined-code')`, lines 381-390) + playground/css/main.js (lines 100-102,
//   `import inlined from './inlined.css?inline'`).
//
// `?inline` returns the processed CSS as a STRING (default export) and does NOT
// inject a `<style>`. Vite's `inlined` test asserts the rule does NOT take effect
// (`getColor('.inlined')` is `black`, i.e. NO style injected) and the `inlined-code`
// test asserts the imported string carries the real CSS content.
//
// Reload-guard (same pattern as the `.css` / `.scss` ports, tests.ts lines 17-18):
// the `.inline` element handle is grabbed BEFORE the edit, so a full page reload
// would detach it.
//
// CRITICAL METHODOLOGY: the edit string `color: green` occurs EXACTLY ONCE in
// inline.css (the real rule on line 2; the file has NO comments), so the single-
// match `String.prototype.replace` in editFile provably changes the rendered
// declaration — this avoids the comment-collision artifact that made the
// .less/.styl/.pcss "stale" verdicts a test artifact.
//
// FBM is dev-only, so the assertions only run in serve mode.
if (!isBuild) {
  // 1. Load/resolve: the `?inline` import returns the CSS source as a STRING and
  //    does NOT inject a `<style>` — so `.inline` keeps the default color (NOT green)
  //    and the rendered string carries the CSS content.
  test('CSS ?inline loads as a string (no style injected) under FBM (bundledDev)', async () => {
    await expect.poll(() => page.textContent('.app')).toBe('css-inline loaded')

    // The imported value is the CSS source string (rendered into `.inline-code`).
    const code = await page.textContent('.inline-code')
    expect(code).toContain('color: green')
    expect(code).toContain('.inline')

    // No `<style>` was injected for the `?inline` import: the `.inline { color: green }`
    // rule must NOT take effect, so the element keeps the default color (not green).
    expect(await getColor('.inline')).not.toBe('green')
  })

  // 2. HMR: editing the `.css` re-evaluates the `?inline` module and the imported
  //    string updates to the new CSS content (still NO style injected).
  test('CSS ?inline string updates on HMR under FBM', async () => {
    const inlineEl = await page.$('.inline')
    expect(await getColor(inlineEl)).not.toBe('green')

    editFile('inline.css', (code) =>
      code.replace('color: green', 'color: navy'),
    )

    // The `?inline` module re-evaluates: the rendered string reflects the edit.
    await expect
      .poll(() => page.textContent('.inline-code'))
      .toContain('color: navy')
    expect(await page.textContent('.inline-code')).not.toContain('color: green')

    // Still inlined (not injected): the `.inline` element must NOT become navy.
    expect(await getColor('.inline')).not.toBe('rgb(0, 0, 128)')
  })
}
