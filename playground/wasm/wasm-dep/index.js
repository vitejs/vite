import { __wbg_set_wasm } from './glue.js'
// Mimics a wasm-bindgen entrypoint: imports the wasm binary and the JS glue,
// then initialises the glue with the wasm instance. `glue.wasm` is a minimal
// wasm that imports `__wbg_get_value` from `./glue.js` and calls it from
// `run()`.
import * as wasm from './glue.wasm'

__wbg_set_wasm(wasm)

export function getWasmDepResult() {
  return wasm.run()
}
