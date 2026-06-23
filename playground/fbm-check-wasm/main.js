// Plain `.wasm` default import (WASM ESM Integration) imported from JS — mirrors
// Vite's `playground/wasm` "direct wasm import" cases (index.html L45-46, L54-57):
//   `import { add } from './add.wasm'; text('.direct-wasm .result', add(1, 2))`
//   `import { exported_func } from './light-with-imports.wasm'; import { getResult } from './imports.js'`
//   `exported_func(); text('.direct-wasm-with-imports .result', getResult())`
//
// With a plain `.wasm` import, Vite's `vite:wasm-helper` plugin (plugins/wasm.ts)
// resolves `.wasm` to JS GLUE CODE that:
//   1. imports the wasm helper (`\0vite/wasm-helper.js`),
//   2. computes the emitted wasm URL via `fileToUrl` (in FBM dev: a real
//      `/assets/<name>-<hash>.wasm`, NOT a placeholder),
//   3. top-level-awaits `initWasm(importObject, wasmUrl)` which fetches +
//      `WebAssembly.instantiate`s the bytes,
//   4. re-exports the wasm module's exports.
//
// So the import LOAD itself depends on the wasm URL being a REAL resolvable asset:
// if the URL is an unresolved __ROLLDOWN_ASSET__/__VITE_ASSET__ placeholder or 404,
// `fetch(url)` -> `WebAssembly.instantiate` throws and the module fails to load.
//
// `add.wasm` has no wasm imports and exports `add`/`add2`/`add3`/`add4`, each
// `(i32,i32)->i32` returning `a+b` (so `add(1,2) === 3`).
// `light-with-imports.wasm` IMPORTS `imported_func` from `./imports.js` and exports
// `exported_func` (which calls `imported_func(42)`); `getResult()` then returns 42 —
// this exercises the glue-code's wasm-import resolution too.

// Static top-level imports — mirrors Vite's playground/wasm/index.html exactly.
import { add } from './add.wasm'
import { exported_func } from './light-with-imports.wasm'
import { getResult } from './imports.js'
// Emitted-asset variant: same exports as add.wasm but padded >= assetsInlineLimit
// (4096B) so it takes the EMITTED `/assets/<name>-<hash>.wasm` path instead of being
// inlined as a data URI — this is the FBM-milestone-target path where the emitted
// asset can freeze on HMR (#22596 family). add(1,2) is still 3.
import { add as addEmitted } from './add-padded.wasm'

try {
  // Direct wasm import, no wasm imports: add(1, 2) === 3.
  document.querySelector('.direct-wasm .result').textContent = String(add(1, 2))

  // Direct wasm import WITH wasm imports (imports `imported_func` from imports.js).
  exported_func()
  document.querySelector('.direct-wasm-with-imports .result').textContent =
    String(getResult())

  // Direct wasm import from an EMITTED asset: add(1, 2) === 3.
  document.querySelector('.direct-wasm-emitted .result').textContent = String(
    addEmitted(1, 2),
  )

  document.querySelector('.app').textContent = 'wasm loaded'
} catch (e) {
  // Surface an instantiation failure (e.g. unresolved asset placeholder / 404)
  // to the spec so a LOAD failure is observable, not silent.
  document.querySelector('.error').textContent = `ERROR: ${e?.message ?? e}`
  document.querySelector('.app').textContent = 'wasm failed'
}
