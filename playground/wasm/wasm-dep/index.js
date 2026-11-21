import { __wbg_set_wasm as setBareWasm } from '@vitejs/test-wasm-dep/bare-glue'
import { __wbg_set_wasm } from './glue.js'
// Mimics a wasm-bindgen entrypoint: imports the wasm binary and the JS glue,
// then initialises the glue with the wasm instance. `glue.wasm` is a minimal
// wasm that imports `__wbg_get_value` from `./glue.js` and calls it from
// `run()`.
import * as wasm from './glue.wasm'
import * as bareWasm from './nested/bare.wasm'
import { __wbg_set_wasm as setNestedWasm } from './nested/glue.js'
import * as nestedWasm from './nested/wasm/glue.wasm'

__wbg_set_wasm(wasm)
setNestedWasm(nestedWasm)
setBareWasm(bareWasm)

export function getWasmDepResult() {
  return wasm.run()
}

export function getNestedWasmDepResult() {
  return nestedWasm.run()
}

export function getBareWasmDepResult() {
  return bareWasm.run()
}
