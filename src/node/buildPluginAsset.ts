import path from 'path'
import { promises as fs } from 'fs'
import { Plugin } from 'rollup'
import { isStaticAsset } from './utils'
import hash_sum from 'hash-sum'
import slash from 'slash'

const debug = require('debug')('vite:build:asset')

export const createBuildAssetPlugin = (assetsDir: string): Plugin => {
  const assets = new Map()

  return {
    name: 'vite:asset',
    load(id) {
      if (isStaticAsset(id)) {
        const ext = path.extname(id)
        const baseName = path.basename(id, ext)
        const resolvedName = `${baseName}.${hash_sum(id)}${ext}`
        assets.set(id, resolvedName)
        const publicPath = slash(path.join('/', assetsDir, resolvedName))
        debug(`${id} -> ${publicPath}`)
        return `export default ${JSON.stringify(publicPath)}`
      }
    },

    async generateBundle(_options, bundle) {
      for (const [from, fileName] of assets) {
        bundle[fileName] = {
          isAsset: true,
          type: 'asset',
          fileName,
          source: await fs.readFile(from)
        }
      }
    }
  }
}
