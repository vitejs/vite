import MagicString from 'magic-string'
import { exactRegex } from 'rolldown/filter'
import { createToImportMetaURLBasedRelativeRuntime } from '../build'
import type { Plugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { assetUrlRE, fileToUrl } from './asset'

const wasmHelperId = '\0vite/wasm-helper.js'

const wasmInitRE = /(?<![?#].*)\.wasm\?init/

const wasmInitUrlRE: RegExp = /__VITE_WASM_INIT__([\w$]+)__/g

const wasmHelper = async (opts = {}, url: string) => {
  let result
  if (url.startsWith('data:')) {
    const urlContent = url.replace(/^data:.*?base64,/, '')
    let bytes
    if (typeof Buffer === 'function' && typeof Buffer.from === 'function') {
      bytes = Buffer.from(urlContent, 'base64')
    } else if (typeof atob === 'function') {
      const binaryString = atob(urlContent)
      bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
    } else {
      throw new Error(
        'Failed to decode base64-encoded data URL, Buffer and atob are not supported',
      )
    }
    result = await WebAssembly.instantiate(bytes, opts)
  } else {
    result = await instantiateFromUrl(url, opts)
  }
  return result.instance
}

const wasmHelperCode = wasmHelper.toString()

const instantiateFromUrl = async (url: string, opts?: WebAssembly.Imports) => {
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
    return WebAssembly.instantiateStreaming(response, opts)
  } else {
    const buffer = await response.arrayBuffer()
    return WebAssembly.instantiate(buffer, opts)
  }
}

const instantiateFromUrlCode = instantiateFromUrl.toString()

const instantiateFromFile = async (
  fileUrlString: string,
  opts?: WebAssembly.Imports,
) => {
  const { readFile } = await import('node:fs/promises')
  const fileUrl = new URL(fileUrlString, /** #__KEEP__ */ import.meta.url)
  const buffer = await readFile(fileUrl)
  return WebAssembly.instantiate(buffer, opts)
}

const instantiateFromFileCode = instantiateFromFile.toString()

export const wasmHelperPlugin = (): Plugin => {
  return {
    name: 'vite:wasm-helper',

    resolveId: {
      filter: { id: exactRegex(wasmHelperId) },
      handler(id) {
        return id
      },
    },

    load: {
      filter: { id: [exactRegex(wasmHelperId), wasmInitRE] },
      async handler(id) {
        const ssr = this.environment.config.consumer === 'server'

        if (id === wasmHelperId) {
          return `
const instantiateFromUrl = ${ssr ? instantiateFromFileCode : instantiateFromUrlCode}
export default ${wasmHelperCode}
`
        }

        id = id.split('?')[0]
        let url = await fileToUrl(this, id, ssr)
        if (ssr && assetUrlRE.test(url)) {
          url = url.replace('__VITE_ASSET__', '__VITE_WASM_INIT__')
        }
        return `
  import initWasm from "${wasmHelperId}"
  export default opts => initWasm(opts, ${JSON.stringify(url)})
  `
      },
    },

    renderChunk(code, chunk, opts) {
      if (this.environment.config.consumer !== 'server') {
        return null
      }

      const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
        opts.format,
        this.environment.config.isWorker,
      )

      let match: RegExpExecArray | null
      let s: MagicString | undefined

      wasmInitUrlRE.lastIndex = 0
      while ((match = wasmInitUrlRE.exec(code))) {
        const [full, referenceId] = match
        const file = this.getFileName(referenceId)
        chunk.viteMetadata!.importedAssets.add(cleanUrl(file))
        const { runtime } = toRelativeRuntime(file, chunk.fileName)
        s ||= new MagicString(code)
        s.update(match.index, match.index + full.length, `"+${runtime}+"`)
      }

      if (s) {
        return {
          code: s.toString(),
          map: this.environment.config.build.sourcemap
            ? s.generateMap({ hires: 'boundary' })
            : null,
        }
      } else {
        return null
      }
    },
  }
}
