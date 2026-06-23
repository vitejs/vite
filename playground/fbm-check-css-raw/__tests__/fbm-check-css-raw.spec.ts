import { expect, test } from 'vitest'
import { editFile, isBuild, page, readFile } from '~utils'

// Faithful FBM port of Vite's CSS `?raw` case in playground/css.
// vite ref: playground/css/__tests__/tests.ts (`test('?raw')`, lines 407-422)
//   + playground/css/main.js (lines 14-15, `import rawCss from './raw-imported.css?raw'`
//   then `text('.raw-imported-css', rawCss)`).
//
// `?raw` returns the RAW, UN-transformed file contents as a STRING (default export):
// no CSS processing, no `<style>` injection. Vite's test asserts the rendered string
// EQUALS the on-disk file contents (`readFileSync(require.resolve('../raw-imported.css'))`),
// then on HMR edits `color: yellow` -> `color: blue` and polls the rendered text to
// match `color: blue`. We mirror both, using the harness's `readFile` (resolves
// relative to the playground-temp testDir copy) for the exact-content assertion.
//
// The raw source deliberately carries a comment + a nested `&-imported` selector
// (invalid plain CSS): if `?raw` returned *processed* CSS, the comment would be
// stripped and the nesting flattened — so an exact-content match proves it is raw.
//
// CRITICAL METHODOLOGY: the edit string `color: yellow` occurs EXACTLY ONCE in
// raw.css (the real declaration on line 4; the comment carries NO color/yellow/blue
// token), so the single-match `String.prototype.replace` in editFile provably changes
// the rendered content — avoiding the comment-collision artifact that made the
// .less/.styl/.pcss "stale" verdicts a test artifact.
//
// FBM is dev-only, so the HMR assertion only runs in serve mode.
test('CSS ?raw loads as the raw file contents under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('css-raw loaded')

  // The imported value is the RAW file contents (rendered into `.raw-imported-css`),
  // equal byte-for-byte to the source file — NOT processed CSS, NOT injected.
  const rendered = await page.textContent('.raw-imported-css')
  expect(rendered).toBe(readFile('raw.css'))
})

if (!isBuild) {
  // HMR: editing the `.css` re-evaluates the `?raw` module and the imported raw
  // string updates to the new file contents.
  test('CSS ?raw string updates on HMR under FBM', async () => {
    editFile('raw.css', (code) => code.replace('color: yellow', 'color: blue'))

    await expect
      .poll(() => page.textContent('.raw-imported-css'))
      .toMatch('color: blue')

    // The updated raw string equals the new on-disk file contents exactly.
    expect(await page.textContent('.raw-imported-css')).toBe(
      readFile('raw.css'),
    )
  })
}
