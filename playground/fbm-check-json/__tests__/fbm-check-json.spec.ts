import { expect, test } from 'vitest'
import {
  browserErrors,
  browserLogs,
  editFile,
  isBuild,
  page,
  untilBrowserLogAfter,
} from '~utils'

// Faithful FBM port of Vite's `.json` case in playground/json.
// vite ref: playground/json/__tests__/csr/json-csr.spec.ts
//   - `test('default import')`  L13-15  (`JSON.stringify(testJson)` rendered into `.full`)
//   - `test('named import')`    L17-19  (`testJson.hello` rendered into `.named`)
//   - `test.runIf(isServe)('should full reload')` L66-76 (edit hmr value -> page reflects new value)
// + playground/json/index.html script (`import json, { hello } from './test.json'`).
//
// `import data from './x.json'` returns the PARSED object (default export); Vite also
// exposes a NAMED export per top-level key (`import { hello } from './x.json'`). On a
// `.json` edit, the file is a non-accepted dependency of the entry, so Vite does a FULL
// RELOAD (Vite's `should full reload` test) rather than a hot patch.
//
// REGRESSION GUARD (#6332): a STATIC `.json` import must NOT throw a ReferenceError
// under FBM HMR. We assert no ReferenceError appears in the browser console across both
// the initial load AND the HMR full reload.
//
// CLEAN-EDIT METHODOLOGY: the edit needle `"this is hmr json"` occurs EXACTLY ONCE in
// test.json (verified `grep -c` -> 1), and the file has NO comments, so editFile's
// single-match `String.prototype.replace` provably changes the real value — avoiding the
// comment-collision artifact that made the .less/.styl/.pcss "stale" verdicts a test
// artifact.

const testJson = { hello: 'this is json', hmr: 'this is hmr json' }
const stringified = JSON.stringify(testJson)

// 1. Load/resolve: the static `.json` import resolves under FBM dev load.
//    - default import is the PARSED object with the expected values
//    - a NAMED import of a top-level key returns the right value
test('.json default + named import load under FBM (bundledDev)', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('json loaded')

  // default export = parsed object (rendered as JSON.stringify, same as Vite's test)
  expect(await page.textContent('.full')).toBe(stringified)
  // named export per top-level key
  expect(await page.textContent('.named')).toBe(testJson.hello)

  // #6332 regression guard: a static `.json` import must not throw a ReferenceError.
  expect(browserErrors.map((e) => e.message).join('\n')).not.toMatch(
    /ReferenceError/,
  )
  expect(browserLogs.join('\n')).not.toMatch(/ReferenceError/)
})

// 2. HMR: editing a value in the `.json` triggers a FULL RELOAD (Vite's `should full
//    reload`); after it, the page reflects the new value. NO ReferenceError must appear
//    (the #6332 symptom). FBM is dev-only, so this only runs in serve mode.
if (!isBuild) {
  test('.json HMR full-reloads and reflects the new value under FBM (no ReferenceError)', async () => {
    expect(await page.textContent('.hmr')).toBe(testJson.hmr)

    // Editing the json value sends a full-reload payload; main.js logs on
    // `vite:beforeFullReload`, so we can confirm the reload actually fired.
    await untilBrowserLogAfter(
      () =>
        editFile('test.json', (code) =>
          code.replace('"this is hmr json"', '"this is hmr update json"'),
        ),
      'json full reload',
    )

    // After the reload the entry re-runs and re-renders the new value.
    await expect
      .poll(() => page.textContent('.hmr'))
      .toBe('this is hmr update json')
    // The default-import object reflects the edit too.
    await expect
      .poll(() => page.textContent('.full'))
      .toBe(
        JSON.stringify({
          hello: 'this is json',
          hmr: 'this is hmr update json',
        }),
      )

    // #6332 regression guard across the HMR reload: no ReferenceError anywhere.
    expect(browserErrors.map((e) => e.message).join('\n')).not.toMatch(
      /ReferenceError/,
    )
    expect(browserLogs.join('\n')).not.toMatch(/ReferenceError/)
  })
}
