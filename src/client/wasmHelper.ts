declare const atob: any
declare const fetch: any
declare const WebAssembly: any

async function initWasm(opts = {}, url: string) {
  let result
  if (url.startsWith('data:')) {
    const binaryString = atob(url.replace(/^data:.*?base64,/, ''))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    result = await WebAssembly.instantiate(bytes, opts)
  } else {
    // https://github.com/mdn/webassembly-examples/issues/5
    // WebAssembly.instantiateStreaming requires the server to provide the
    // correct MIME type for .wasm files, which unfortunately doesn't work for
    // a lot of static file servers, so we just work around it by getting the
    // raw buffer.
    const response = await fetch(url)
    const contentType = response.headers.get('Content-Type')
    if (
      'instantiateStreaming' in WebAssembly &&
      contentType.startsWith('application/wasm')
    ) {
      result = await WebAssembly.instantiateStreaming(response, opts)
    } else {
      const buffer = await response.arrayBuffer()
      result = await WebAssembly.instantiate(buffer, opts)
    }
  }
  return result.instance.exports
}

export const id = '/vite/wasm-helper'
export const code = initWasm.toString()
