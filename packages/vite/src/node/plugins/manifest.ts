import path from 'path'
import { OutputChunk } from 'rollup'
import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'
import { chunkToEmittedCssFileMap } from './css'
import { chunkToEmittedAssetsMap } from './asset'
import { normalizePath } from '../utils'

type Manifest = Record<string, ManifestChunk>

interface ManifestChunk {
  src?: string
  file: string
  css?: string[]
  assets?: string[]
  isEntry?: boolean
  isDynamicEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
}

export function manifestPlugin(config: ResolvedConfig): Plugin {
  const manifest: Manifest = {}

  let outputCount = 0

  return {
    name: 'vite:manifest',
    generateBundle({ format }, bundle) {
      function getChunkName(chunk: OutputChunk) {
        if (chunk.facadeModuleId) {
          let name = normalizePath(
            path.relative(config.root, chunk.facadeModuleId)
          )
          if (format === 'system' && !chunk.name.includes('-legacy')) {
            const ext = path.extname(name)
            name = name.slice(0, -ext.length) + `-legacy` + ext
          }
          return name
        } else {
          return `_` + path.basename(chunk.fileName)
        }
      }

      function createChunk(chunk: OutputChunk): ManifestChunk {
        const manifestChunk: ManifestChunk = {
          file: chunk.fileName
        }

        if (chunk.facadeModuleId) {
          manifestChunk.src = getChunkName(chunk)
        }
        if (chunk.isEntry) {
          manifestChunk.isEntry = true
        }
        if (chunk.isDynamicEntry) {
          manifestChunk.isDynamicEntry = true
        }

        if (chunk.imports.length) {
          manifestChunk.imports = chunk.imports.map((file) =>
            getChunkName(bundle[file] as OutputChunk)
          )
        }

        if (chunk.dynamicImports.length) {
          manifestChunk.dynamicImports = chunk.dynamicImports.map((file) =>
            getChunkName(bundle[file] as OutputChunk)
          )
        }

        const cssFiles = chunkToEmittedCssFileMap.get(chunk)
        if (cssFiles) {
          manifestChunk.css = [...cssFiles]
        }

        const assets = chunkToEmittedAssetsMap.get(chunk)
        if (assets) [(manifestChunk.assets = [...assets])]

        return manifestChunk
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          manifest[getChunkName(chunk)] = createChunk(chunk)
        }
      }

      outputCount++
      const output = config.build.rollupOptions?.output
      const outputLength = Array.isArray(output) ? output.length : 1
      if (outputCount >= outputLength) {
        this.emitFile({
          fileName: `manifest.json`,
          type: 'asset',
          source: JSON.stringify(manifest, null, 2)
        })
      }
    }
  }
}
