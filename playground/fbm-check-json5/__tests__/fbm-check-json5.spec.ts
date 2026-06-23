import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

// Faithful FBM port of Vite's `.json` case in playground/json, adapted to `.json5`.
// Vite has NO dedicated `.json5` playground/spec — the `.json5` lang is only declared via
// `jsonLangs` (packages/vite/src/node/plugins/json.ts:16). So this ports the closest real
// case: the `.json` default-import + named-import + HMR full-reload pattern.
// vite ref: playground/json/__tests__/csr/json-csr.spec.ts
//   - `test('default import')`  L12-14  (`JSON.stringify(testJson)` rendered into `.full`)
//   - `test('named import')`    L16-18  (`testJson.hello` rendered into `.named`)
//   - `test.runIf(isServe)('should full reload')` L56-65 (edit hmr value -> new value)
// + playground/json/index.html script (`import json, { hello } from './test.json'`).
//
// JSON5-only syntax proof: test.json5 uses a `//` comment, an unquoted key (`hello:`),
// single-quoted string values, and a trailing comma — none of which `JSON.parse` accepts.
// If `.json5` were parsed as JSON5, the default import would equal the parsed object below.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// VERDICT: FAILS in FBM. `.json5` does NOT load at all — the dev bundle fails with a JS
// PARSE_ERROR on test.json5 ("Expected a semicolon ... after a statement", test.json5:5:6).
// FBM never routes `.json5` to the JSON module type, so Rolldown's default JS (OXC) parser
// tries to parse the relaxed-JSON source AS JAVASCRIPT and chokes. The page shows the FBM
// build-error overlay; `main.js` never runs, so `.app` never becomes `json5 loaded`.
//
// ROOT CAUSE (see RESULT.md `.json5` entry for full file:line detail):
//   1. Rolldown's default extension→module-type table maps only `json` → ModuleType::Json
//      (crates/rolldown/src/utils/prepare_build_context.rs:233); `json5` is absent, so
//      get_module_loader_from_file_extension (utils/load_source.rs:148-159) returns None
//      for `*.json5` → the file falls through to the default JS parse path.
//   2. Rolldown's ViteJsonPlugin.transform additionally gates on is_json_ext (matches
//      `.json` only — crates/rolldown_plugin_vite_json/src/utils.rs:2-11) AND uses
//      serde_json::from_str (lib.rs:53,71), which is standard-JSON-only and could not
//      parse JSON5 syntax even if `.json5` reached it. There is ZERO `json5` handling
//      anywhere in Rolldown crates.
// Even a `.json5` file with plain *standard* JSON content fails to bundle under FBM
// (probed) — confirming the gap is the missing `.json5`→JSON routing, not just the dialect.
//
// Marked `test.fails(...)` so the committed suite stays green while documenting the gap.
// Short explicit poll timeouts keep the known-failures fast (the page never loads).
//
// CLEAN-EDIT METHODOLOGY (JSON5 ALLOWS COMMENTS — extra care): the HMR edit needle
// `'phrase-alpha'` occurs EXACTLY ONCE in test.json5, on the real `hmr` value (line 5),
// and does NOT appear in either `//` comment (verified `grep -c` -> 1). So if the module
// did load, editFile's single-match `String.prototype.replace` would change the real value
// — avoiding the comment-collision artifact that made the .less/.styl/.pcss verdicts a
// test artifact. (Here the edit is moot because `.json5` never bundles in the first place.)

const testJson5 = { hello: 'this is json5', hmr: 'phrase-alpha' }
const stringified = JSON.stringify(testJson5)

// 1. Load/resolve — EXPECTED (Vite semantics): the static `.json5` import resolves under
//    FBM dev load, default export = the parsed object, named export per top-level key.
//    ACTUAL (FBM): the dev bundle fails with a JS PARSE_ERROR on test.json5, so the page
//    never reaches `json5 loaded` and these assertions never hold → `test.fails`.
test.fails('.json5 default + named import load under FBM (known fail: not routed to JSON)', async () => {
  await expect
    .poll(() => page.textContent('.app'), { timeout: 3000 })
    .toBe('json5 loaded')

  // default export = parsed object (only producible by a real JSON5 parse)
  expect(await page.textContent('.full')).toBe(stringified)
  // named export per top-level key
  expect(await page.textContent('.named')).toBe(testJson5.hello)
})

// 2. HMR — EXPECTED (Vite semantics): editing a value triggers a FULL RELOAD and the page
//    reflects the new value. ACTUAL (FBM): moot — `.json5` never loaded (build error), so
//    the edit cannot take effect and `.hmr` never becomes the new value → `test.fails`.
//    FBM is dev-only, so this only runs in serve mode.
if (!isBuild) {
  test.fails('.json5 HMR reflects the new value under FBM (known fail: not routed to JSON)', async () => {
    editFile('test.json5', (code) =>
      code.replace("'phrase-alpha'", "'phrase-beta'"),
    )
    await expect
      .poll(() => page.textContent('.hmr'), { timeout: 3000 })
      .toBe('phrase-beta')
  })
}
