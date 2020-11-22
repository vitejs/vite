declare const atob: any
declare const fetch: any
declare const WebAssembly: any

function initWasm(opts = {}, url: string) {
  let instance
  if (url.startsWith('data:')) {
    const binaryString = atob(url.replace(/^data:.*?base64,/, ''))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    instance = WebAssembly.instantiate(bytes.buffer, opts)
  } else {
    // https://github.com/mdn/webassembly-examples/issues/5
    // WebAssembly.instantiateStreaming requires the server to provide the
    // correct MIME type for .wasm files, which unfortunately doesn't work for
    // a lot of static file servers, so we just work around it by getting the
    // raw buffer.
    instance = fetch(url)
      .then((r: any) => r.arrayBuffer())
      .then((bytes: ArrayBuffer) => WebAssembly.instantiate(bytes, opts))
  }
  return instance.then((i: any) => i.instance.exports)
}

export const id = '/vite/wasm-helper'
export const code = initWasm.toString()
