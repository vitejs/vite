import { Plugin } from 'rollup'
import { resolveAsset, registerAssets } from './buildPluginAsset'

const wasmHelperId = 'vite/wasm-helper'

const wasmHelper = (opts = {}, url: string) => {
  let instance
  if (url.startsWith('data:')) {
    // @ts-ignore
    const binaryString = atob(url.replace(/^data:.*?base64,/, ''))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    // @ts-ignore
    instance = WebAssembly.instantiate(bytes.buffer, opts)
  } else {
    // https://github.com/mdn/webassembly-examples/issues/5
    // WebAssembly.instantiateStreaming requires the server to provide the
    // correct MIME type for .wasm files, which unfortunately doesn't work for
    // a lot of static file servers, so we just work around it by getting the
    // raw buffer.
    // @ts-ignore
    instance = fetch(url)
      // @ts-ignore
      .then((r) => r.arrayBuffer())
      // @ts-ignore
      .then((bytes) => WebAssembly.instantiate(bytes, opts))
  }
  return instance.then((i: any) => i.instance.exports)
}

const wasmHelperCode = wasmHelper.toString()

export const createBuildWasmPlugin = (
  root: string,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Plugin => {
  const assets = new Map<string, Buffer>()

  return {
    name: 'vite:wasm',

    resolveId(id) {
      if (id === wasmHelperId) {
        return id
      }
    },

    async load(id) {
      if (id === wasmHelperId) {
        return `export default ${wasmHelperCode}`
      }

      if (id.endsWith('.wasm')) {
        const { fileName, content, url } = await resolveAsset(
          id,
          root,
          publicBase,
          assetsDir,
          inlineLimit
        )
        if (fileName && content) {
          assets.set(fileName, content)
        }

        return `
import initWasm from "${wasmHelperId}"
export default opts => initWasm(opts, ${JSON.stringify(url)})
`
      }
    },

    generateBundle(_options, bundle) {
      registerAssets(assets, bundle)
    }
  }
}
