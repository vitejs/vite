import { defineConfig } from 'vite'

// Faithful FBM port of Vite's plain `.wasm` default-import case (playground/wasm —
// the "direct wasm import" cases: `import { add } from './add.wasm'` and
// `import { exported_func } from './light-with-imports.wasm'`).
//
// The plain `.wasm` import (WASM ESM Integration) makes Vite's `vite:wasm-helper`
// plugin generate glue code that imports the wasm helper, fetches the emitted
// `/assets/<name>-<hash>.wasm`, instantiates it, and re-exports the module's exports.
//
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
