import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { fileToUrl } from './asset'

const wasmHelperId = '/__vite-wasm-helper'

const wasmHelper = async (opts = {}, url: string) => {
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
    const contentType = response.headers.get('Content-Type') || ''
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
  return result.instance
}

const wasmHelperCode = wasmHelper.toString()

export const wasmHelperPlugin = (config: ResolvedConfig): Plugin => {
  return {
    name: 'vite:wasm-helper',

    resolveId(id) {
      if (id === wasmHelperId) {
        return id
      }
    },

    async load(id) {
      if (id === wasmHelperId) {
        return `export default ${wasmHelperCode}`
      }

      if (!id.endsWith('.wasm?init')) {
        return
      }

      const url = await fileToUrl(id, config, this)

      return `
import initWasm from "${wasmHelperId}"
export default opts => initWasm(opts, ${JSON.stringify(url)})
`
    }
  }
}

export const wasmFallbackPlugin = (): Plugin => {
  return {
    name: 'vite:wasm-fallback',

    async load(id) {
      if (!id.endsWith('.wasm')) {
        return
      }

      throw new Error(
        '"ESM integration proposal for Wasm" is not supported currently. ' +
          'Use vite-plugin-wasm or other community plugins to handle this. ' +
          'Alternatively, you can use `.wasm?init` or `.wasm?url`. ' +
          'See https://vitejs.dev/guide/features.html#webassembly for more details.'
      )
    }
  }
}
