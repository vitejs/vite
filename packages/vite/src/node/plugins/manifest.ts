import path from 'path'
import type { OutputChunk } from 'rollup'
import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { normalizePath } from '../utils'

export type Manifest = Record<string, ManifestChunk>

export interface ManifestChunk {
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

  let outputCount: number

  return {
    name: 'vite:manifest',

    buildStart() {
      outputCount = 0
    },

    generateBundle({ format }, bundle) {
      function getChunkName(chunk: OutputChunk) {
        if (chunk.facadeModuleId) {
          let name = normalizePath(
            path.relative(config.root, chunk.facadeModuleId)
          )
          if (format === 'system' && !chunk.name.includes('-legacy')) {
            const ext = path.extname(name)
            const endPos = ext.length !== 0 ? -ext.length : undefined
            name = name.slice(0, endPos) + `-legacy` + ext
          }
          return name.replace(/\0/g, '')
        } else {
          return `_` + path.basename(chunk.fileName)
        }
      }

      function getInternalImports(imports: string[]): string[] {
        const filteredImports: string[] = []

        for (const file of imports) {
          if (bundle[file] === undefined) {
            continue
          }

          filteredImports.push(getChunkName(bundle[file] as OutputChunk))
        }

        return filteredImports
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
          const internalImports = getInternalImports(chunk.imports)
          if (internalImports.length > 0) {
            manifestChunk.imports = internalImports
          }
        }

        if (chunk.dynamicImports.length) {
          const internalImports = getInternalImports(chunk.dynamicImports)
          if (internalImports.length > 0) {
            manifestChunk.dynamicImports = internalImports
          }
        }

        if (chunk.viteMetadata.importedCss.size) {
          manifestChunk.css = [...chunk.viteMetadata.importedCss]
        }
        if (chunk.viteMetadata.importedAssets.size) {
          manifestChunk.assets = [...chunk.viteMetadata.importedAssets]
        }

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
          fileName:
            typeof config.build.manifest === 'string'
              ? config.build.manifest
              : 'manifest.json',
          type: 'asset',
          source: JSON.stringify(manifest, null, 2)
        })
      }
    }
  }
}
