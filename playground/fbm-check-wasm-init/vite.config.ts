import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `*.wasm?init` case (playground/wasm — the
// "should work when inlined" / "should work when output" / "init function returns
// WebAssembly.Instance" cases that use `import light from './light.wasm?init'` and
// `import heavy from './heavy.wasm?init'`).
//
// `*.wasm?init` makes Vite's `vite:wasm-helper` plugin (plugins/wasm.ts:109-114)
// generate a tiny module:
//   import initWasm from "\0vite/wasm-helper.js"
//   export default opts => initWasm(opts, "<url>")
// i.e. the default export is an `init(imports?)` FUNCTION. Calling `await init(opts)`
// fetches/decodes the wasm at `<url>` and returns a `WebAssembly.Instance`. The `<url>`
// is computed by `fileToUrl` (wasm.ts:103) exactly like the direct `.wasm` import — in
// FBM dev (`isBundled: true`) that is the BUILD asset path (`fileToBuiltUrl`): an inline
// `data:application/wasm` URI for small files, a real `/assets/<name>-<hash>.wasm` for
// files >= assetsInlineLimit (4096B).
//
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
