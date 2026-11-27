let wasm

export function __wbg_set_wasm(value) {
  wasm = value
}

export function __wbg_get_value() {
  return wasm.value()
}
