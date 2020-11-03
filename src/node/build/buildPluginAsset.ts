import { Plugin, OutputBundle } from 'rollup'
import { BuildContext } from './context'

const debug = require('debug')('vite:build:asset')

export const injectAssetRe = /import.meta.ROLLUP_FILE_URL_(\w+)/

export const registerAssets = (
  assets: Map<string, Buffer>,
  bundle: OutputBundle
) => {
  for (const [fileName, source] of assets) {
    bundle[fileName] = {
      name: fileName,
      isAsset: true,
      type: 'asset',
      fileName,
      source
    }
  }
}

export const createBuildAssetPlugin = (ctx: BuildContext): Plugin => {
  const handleToIdMap = new Map()

  return {
    name: 'vite:asset',
    async load(id) {
      if (ctx.resolver.isAssetRequest(id)) {
        let { fileName, content, url } = await ctx.resolveAsset(id)
        if (!url && fileName && content) {
          const fileHandle = this.emitFile({
            name: fileName,
            type: 'asset',
            source: content
          })
          url = 'import.meta.ROLLUP_FILE_URL_' + fileHandle
          handleToIdMap.set(fileHandle, id)
        } else if (url && url.startsWith(`data:`)) {
          debug(`${id} -> base64 inlined`)
        }
        return `export default ${JSON.stringify(url)}`
      }
    },

    async renderChunk(code) {
      let match
      while ((match = injectAssetRe.exec(code))) {
        const fileHandle = match[1]
        const basedAssetPath = ctx.getBasedAssetPath(
          this.getFileName(fileHandle)
        )
        code = code.replace(match[0], basedAssetPath)
        const originalId = handleToIdMap.get(fileHandle)
        if (originalId) {
          debug(`${originalId} -> ${basedAssetPath}`)
        }
      }
      return { code, map: null }
    }
  }
}
