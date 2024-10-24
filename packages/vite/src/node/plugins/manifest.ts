import path from 'node:path'
import type {
  InternalModuleFormat,
  OutputAsset,
  OutputChunk,
  RenderedChunk,
} from 'rollup'
import type { Plugin } from '../plugin'
import { normalizePath, sortObjectKeys } from '../utils'
import { usePerEnvironmentState } from '../environment'
import { cssEntriesMap } from './asset'

const endsWithJSRE = /\.[cm]?js$/

export type Manifest = Record<string, ManifestChunk>

export interface ManifestChunk {
  src?: string
  file: string
  css?: string[]
  assets?: string[]
  isEntry?: boolean
  name?: string
  isDynamicEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
}

export function manifestPlugin(): Plugin {
  const getState = usePerEnvironmentState(() => {
    return {
      manifest: {} as Manifest,
      outputCount: 0,
      reset() {
        this.outputCount = 0
      },
    }
  })

  return {
    name: 'vite:manifest',

    perEnvironmentStartEndDuringDev: true,

    applyToEnvironment(environment) {
      return !!environment.config.build.manifest
    },

    buildStart() {
      getState(this).reset()
    },

    generateBundle({ format }, bundle) {
      const state = getState(this)
      const { manifest } = state
      const { root } = this.environment.config
      const buildOptions = this.environment.config.build

      function getChunkName(chunk: OutputChunk) {
        return getChunkOriginalFileName(chunk, root, format)
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
          file: chunk.fileName,
          name: chunk.name,
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

        if (chunk.viteMetadata?.importedCss.size) {
          manifestChunk.css = [...chunk.viteMetadata.importedCss]
        }
        if (chunk.viteMetadata?.importedAssets.size) {
          manifestChunk.assets = [...chunk.viteMetadata.importedAssets]
        }

        return manifestChunk
      }

      function createAsset(
        asset: OutputAsset,
        src: string,
        isEntry?: boolean,
      ): ManifestChunk {
        const manifestChunk: ManifestChunk = {
          file: asset.fileName,
          src,
        }
        if (isEntry) manifestChunk.isEntry = true
        return manifestChunk
      }

      const entryCssReferenceIds = cssEntriesMap.get(this.environment)!
      const entryCssAssetFileNames = new Set(entryCssReferenceIds)
      for (const id of entryCssReferenceIds) {
        try {
          const fileName = this.getFileName(id)
          entryCssAssetFileNames.add(fileName)
        } catch {
          // The asset was generated as part of a different output option.
          // It was already handled during the previous run of this plugin.
        }
      }

      const fileNameToAsset = new Map<string, ManifestChunk>()

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          manifest[getChunkName(chunk)] = createChunk(chunk)
        } else if (chunk.type === 'asset' && chunk.names.length > 0) {
          // Add every unique asset to the manifest, keyed by its original name
          const src =
            chunk.originalFileNames.length > 0
              ? chunk.originalFileNames[0]
              : chunk.names[0]
          const isEntry = entryCssAssetFileNames.has(chunk.fileName)
          const asset = createAsset(chunk, src, isEntry)

          // If JS chunk and asset chunk are both generated from the same source file,
          // prioritize JS chunk as it contains more information
          const file = manifest[src]?.file
          if (!(file && endsWithJSRE.test(file))) {
            manifest[src] = asset
            fileNameToAsset.set(chunk.fileName, asset)
          }

          for (const originalFileName of chunk.originalFileNames.slice(1)) {
            manifest[originalFileName] = asset
          }
        }
      }

      state.outputCount++
      const output = buildOptions.rollupOptions?.output
      const outputLength = Array.isArray(output) ? output.length : 1
      if (state.outputCount >= outputLength) {
        this.emitFile({
          fileName:
            typeof buildOptions.manifest === 'string'
              ? buildOptions.manifest
              : '.vite/manifest.json',
          type: 'asset',
          source: JSON.stringify(sortObjectKeys(manifest), undefined, 2),
        })
      }
    },
  }
}

export function getChunkOriginalFileName(
  chunk: OutputChunk | RenderedChunk,
  root: string,
  format: InternalModuleFormat,
): string {
  if (chunk.facadeModuleId) {
    let name = normalizePath(path.relative(root, chunk.facadeModuleId))
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
