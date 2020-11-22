import { Plugin } from 'rollup'
import { resolveAsset } from './buildPluginAsset'
import * as wasmHelper from '../../client/wasmHelper'

export const createBuildWasmPlugin = (
  root: string,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Plugin => {
  return {
    name: 'vite:wasm',

    resolveId(id) {
      if (id === wasmHelper.id) {
        return id
      }
    },

    async load(id) {
      if (id === wasmHelper.id) {
        return `export default ${wasmHelper.code}`
      }

      if (id.endsWith('.wasm')) {
        let { fileName, content, url } = await resolveAsset(
          id,
          root,
          publicBase,
          assetsDir,
          inlineLimit
        )
        if (!url && fileName && content) {
          url =
            'import.meta.ROLLUP_FILE_URL_' +
            this.emitFile({
              name: fileName,
              type: 'asset',
              source: content
            })
        }

        return `
import initWasm from "${wasmHelper.id}"
export default opts => initWasm(opts, ${JSON.stringify(url)})
`
      }
    }
  }
}
