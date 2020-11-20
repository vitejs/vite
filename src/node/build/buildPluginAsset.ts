import path from 'path'
import fs from 'fs-extra'
import { Plugin, OutputBundle } from 'rollup'
import { cleanUrl } from '../utils'
import slash from 'slash'
import mime from 'mime-types'
import { InternalResolver } from '../resolver'

const debug = require('debug')('vite:build:asset')

interface AssetCacheEntry {
  content?: Buffer
  fileName?: string
  url: string | undefined
}

const assetResolveCache = new Map<string, AssetCacheEntry>()
const publicDirRE = /^public(\/|\\)/
export const injectAssetRe = /import.meta.ROLLUP_FILE_URL_(\w+)/

export const resolveAsset = async (
  id: string,
  root: string,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Promise<AssetCacheEntry> => {
  id = cleanUrl(id)
  const cached = assetResolveCache.get(id)
  if (cached) {
    return cached
  }

  let resolved: AssetCacheEntry | undefined
  const relativePath = path.relative(root, id)

  if (!fs.existsSync(id)) {
    // try resolving from public dir
    const publicDirPath = path.join(root, 'public', relativePath)
    if (fs.existsSync(publicDirPath)) {
      // file is resolved from public dir, it will be copied verbatim so no
      // need to read content here.
      resolved = {
        url: publicBase + slash(relativePath)
      }
    }
  }

  if (!resolved) {
    if (publicDirRE.test(relativePath)) {
      resolved = {
        url: publicBase + slash(relativePath.replace(publicDirRE, ''))
      }
    }
  }

  if (!resolved) {
    let url: string | undefined
    let content: Buffer | undefined = await fs.readFile(id)
    if (!id.endsWith(`.svg`) && content.length < Number(inlineLimit)) {
      url = `data:${mime.lookup(id)};base64,${content.toString('base64')}`
      content = undefined
    }

    resolved = {
      content,
      fileName: path.basename(id),
      url
    }
  }

  assetResolveCache.set(id, resolved)
  return resolved
}

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

export const createBuildAssetPlugin = (
  root: string,
  resolver: InternalResolver,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Plugin => {
  const handleToIdMap = new Map()

  return {
    name: 'vite:asset',
    async load(id) {
      if (resolver.isAssetRequest(id)) {
        let { fileName, content, url } = await resolveAsset(
          id,
          root,
          publicBase,
          assetsDir,
          inlineLimit
        )
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
        const outputFilepath =
          publicBase + slash(path.join(assetsDir, this.getFileName(fileHandle)))
        code = code.replace(match[0], outputFilepath)
        const originalId = handleToIdMap.get(fileHandle)
        if (originalId) {
          debug(`${originalId} -> ${outputFilepath}`)
        }
      }
      return { code, map: null }
    }
  }
}
