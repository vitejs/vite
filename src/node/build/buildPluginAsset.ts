import path from 'path'
import fs from 'fs-extra'
import { Plugin, OutputBundle } from 'rollup'
import { isStaticAsset } from '../utils'
import hash_sum from 'hash-sum'
import slash from 'slash'
import mime from 'mime-types'

const debug = require('debug')('vite:build:asset')

interface AssetCacheEntry {
  content: Buffer | null
  fileName: string | null
  url: string
}

const assetResolveCache = new Map<string, AssetCacheEntry>()

export const resolveAsset = async (
  id: string,
  root: string,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Promise<AssetCacheEntry> => {
  const cached = assetResolveCache.get(id)
  if (cached) {
    return cached
  }

  let resolved: AssetCacheEntry | undefined

  const pathFromRoot = path.relative(root, id)
  if (/^public(\/|\\)/.test(pathFromRoot)) {
    // assets inside the public directory will be copied over verbatim
    // so all we need to do is just append the baseDir
    resolved = {
      content: null,
      fileName: null,
      url: slash(path.join(publicBase, pathFromRoot))
    }
  }

  if (!resolved) {
    const ext = path.extname(id)
    const baseName = path.basename(id, ext)
    const resolvedFileName = `${baseName}.${hash_sum(id)}${ext}`

    let url = slash(path.join(publicBase, assetsDir, resolvedFileName))
    const content = await fs.readFile(id)
    if (!id.endsWith(`.svg`) && content.length < inlineLimit) {
      url = `data:${mime.lookup(id)};base64,${content.toString('base64')}`
    }

    resolved = {
      content,
      fileName: resolvedFileName,
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
      isAsset: true,
      type: 'asset',
      fileName,
      source
    }
  }
}

export const createBuildAssetPlugin = (
  root: string,
  publicBase: string,
  assetsDir: string,
  inlineLimit: number
): Plugin => {
  const assets = new Map<string, Buffer>()

  return {
    name: 'vite:asset',
    async load(id) {
      if (isStaticAsset(id)) {
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
        debug(`${id} -> ${url.startsWith('data:') ? `base64 inlined` : url}`)
        return `export default ${JSON.stringify(url)}`
      }
    },

    generateBundle(_options, bundle) {
      registerAssets(assets, bundle)
    }
  }
}
