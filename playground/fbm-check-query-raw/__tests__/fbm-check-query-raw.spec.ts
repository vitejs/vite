import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's GENERAL (non-CSS) `?raw` case in playground/assets.
// vite ref: playground/assets/__tests__/assets.spec.ts (`test('?raw import')`,
//   lines 483-499) + playground/assets/index.html (lines 557-564,
//   `import rawSvg from './nested/fragment.svg?raw'; text('.raw', rawSvg)` and
//   `import rawHtml from './nested/partial.html?raw'; text('.raw-html', rawHtml)`,
//   with `import.meta.hot.accept('./nested/partial.html?raw', m => text('.raw-html', m.default))`).
//
// `?raw` returns the RAW, UN-transformed file contents as a STRING (default export),
// for ANY file extension. Unlike `?url` (which emits an asset and returns a URL), the
// raw string value is BAKED into the JS module — there is no separate asset to freeze.
// Vite's test asserts the rendered SVG raw string contains `SVG`, and the rendered
// `.html` raw string EQUALS `<div>partial</div>\n` exactly; then on HMR it edits
// partial.html `<div>partial</div>` -> `<div>partial updated</div>` and polls the
// rendered `.raw-html` to become `<div>partial updated</div>\n`. We mirror all three.
//
// Expected: like CSS `?raw`, this re-evaluates FRESH on edit (the changed module's
// load+transform re-runs against the freshly-edited bytes, so the patch ships the NEW
// raw string), so HMR PASSES — kept as a normal `test(...)`.
//
// CRITICAL METHODOLOGY: the edit needle `<div>partial</div>` occurs EXACTLY ONCE in
// partial.html (the entire file is `<div>partial</div>\n`; there are no comments and
// `updated` is absent pre-edit), so the single-match `String.prototype.replace` in
// editFile provably changes the rendered raw string — avoiding the comment-collision
// artifact that made the .less/.styl/.pcss "stale" verdicts a test artifact.
test('non-CSS ?raw loads as the raw file contents under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('query-raw loaded')

  // The SVG `?raw` import is the raw file text (contains `SVG`) — NOT an asset URL,
  // NOT processed/inlined SVG markup.
  expect(await page.textContent('.raw-svg')).toMatch('SVG')

  // The HTML `?raw` import is the raw file contents verbatim, equal byte-for-byte to
  // the source file (`<div>partial</div>\n`) — mirrors Vite's exact `.toBe(...)`.
  expect(await page.textContent('.raw-html')).toBe('<div>partial</div>\n')
})

if (!isBuild) {
  // HMR: editing the `.html` re-evaluates the `?raw` module and the imported raw
  // string updates to the new file contents (fresh, not stale) — mirrors Vite's
  // `?raw import` HMR step.
  test('non-CSS ?raw string updates on HMR under FBM', async () => {
    editFile('partial.html', (code) =>
      code.replace('<div>partial</div>', '<div>partial updated</div>'),
    )

    await expect
      .poll(() => page.textContent('.raw-html'))
      .toBe('<div>partial updated</div>\n')
  })
}
