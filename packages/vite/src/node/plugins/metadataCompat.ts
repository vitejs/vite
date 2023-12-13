import type { OutputAsset, OutputChunk, RenderedChunk } from 'rollup'
import type { ChunkMetadata, MetadataManager } from '../metadata'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '..'

/**
 * Adds legacy `viteMetadata` to our new internal metadata manager.
 * This is to support third-party plugins that rely on this property.
 */
export function metadataCompatPlugin(config: ResolvedConfig): Plugin {
  let metadataManager: MetadataManager

  function handleLegacy(
    func: string,
    chunk: RenderedChunk | OutputChunk | OutputAsset,
  ) {
    if ('viteMetadata' in chunk) {
      const legacyMetadata = chunk.viteMetadata as ChunkMetadata
      const metadata = metadataManager.chunk(chunk)

      for (const asset of legacyMetadata.importedAssets) {
        metadata.importedAssets.add(asset)
      }

      for (const css of legacyMetadata.importedCss) {
        metadata.importedCss.add(css)
      }

      config.logger.warnOnce(
        `Found legacy \`viteMetadata\` for chunk ${chunk.fileName} in plugin function \`${func}\`. Please migrate to the new metadata manager API.`,
      )

      delete chunk.viteMetadata
    }
  }

  return {
    name: 'vite:build-metadata-compat',

    inheritMetadata(manager) {
      metadataManager = manager
    },

    augmentChunkHash(chunk) {
      handleLegacy('augmentChunkHash', chunk)
    },

    async renderChunk(_code, chunk) {
      handleLegacy('renderChunk', chunk)
      return null
    },

    generateBundle(_, bundle) {
      for (const file in bundle) {
        handleLegacy('generateBundle', bundle[file])
      }
    },
  }
}
