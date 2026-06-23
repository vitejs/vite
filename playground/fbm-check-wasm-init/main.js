// `*.wasm?init` default import — mirrors Vite's `playground/wasm` `?init` cases
// (index.html L42-43, L59-96):
//   `import light from './light.wasm?init'`   (small  -> inlined data: URI)
//   `import heavy from './heavy.wasm?init'`   (>=4096 -> EMITTED /assets/<name>-<hash>.wasm)
//   const { exported_func } = await init({ imports: { imported_func } }).then(i => i.exports)
//   exported_func()  // light -> imported_func(42); heavy -> imported_func(24)
//   const res = await light({...}); res instanceof WebAssembly.Instance  // true
//
// With `?init`, Vite's `vite:wasm-helper` plugin (plugins/wasm.ts:109-114) resolves the
// module to a tiny glue module whose DEFAULT EXPORT is a function:
//   import initWasm from "\0vite/wasm-helper.js"
//   export default opts => initWasm(opts, "<url>")
// `<url>` is computed by `fileToUrl` (wasm.ts:103) — in FBM dev (`isBundled: true`) the
// BUILD asset path: an inline `data:application/wasm` URI for small files, a real
// `/assets/<name>-<hash>.wasm` for files >= assetsInlineLimit. Calling `await init(opts)`
// fetches/decodes that URL and returns a `WebAssembly.Instance` (wasm.ts:17-40), so the
// CALL itself depends on the URL being a REAL resolvable asset: an unresolved
// __ROLLDOWN_ASSET__/__VITE_ASSET__ placeholder or a 404 would throw in the helper.

// Default imports — faithful to Vite's playground/wasm/index.html L42-43.
import light from './light.wasm?init'
import heavy from './heavy.wasm?init'

// init({ imports: { imported_func } }) -> Instance; read its exports; call exported_func.
// light.wasm's exported_func calls imported_func(42); heavy.wasm's calls imported_func(24).
async function runInit(init, expectedLabel) {
  let received
  const instance = await init({
    imports: {
      imported_func: (res) => {
        received = res
      },
    },
  })
  // init() must resolve to a WebAssembly.Instance (Vite's `init function returns
  // WebAssembly.Instance` case asserts exactly this).
  if (!(instance instanceof WebAssembly.Instance)) {
    throw new Error(
      `${expectedLabel}: init() did not return a WebAssembly.Instance (got ${instance})`,
    )
  }
  instance.exports.exported_func()
  return { instance, received }
}

try {
  // light.wasm?init (inlined data: URI): received === 42.
  const lightRun = await runInit(light, 'light')
  document.querySelector('.inline-wasm-init .result').textContent = String(
    lightRun.received,
  )

  // heavy.wasm?init (EMITTED /assets/<name>-<hash>.wasm): received === 24.
  const heavyRun = await runInit(heavy, 'heavy')
  document.querySelector('.output-wasm-init .result').textContent = String(
    heavyRun.received,
  )

  // init() resolves to a WebAssembly.Instance (mirrors Vite's
  // `init function returns WebAssembly.Instance` case): true.
  document.querySelector('.init-returns-instance .result').textContent = String(
    lightRun.instance instanceof WebAssembly.Instance,
  )

  document.querySelector('.app').textContent = 'wasm-init loaded'
} catch (e) {
  // Surface an init()/instantiation failure (e.g. unresolved asset placeholder / 404)
  // so a LOAD failure is observable, not silent.
  document.querySelector('.error').textContent = `ERROR: ${e?.message ?? e}`
  document.querySelector('.app').textContent = 'wasm-init failed'
}
