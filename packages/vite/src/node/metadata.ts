import type { OutputAsset, OutputChunk, RenderedChunk } from 'rollup'

export interface ChunkMetadata {
  importedAssets: Set<string>
  importedCss: Set<string>
}

export class MetadataManager {
  chunkMetadata: Record<string, ChunkMetadata> = {}

  chunk(chunk: RenderedChunk | OutputChunk | OutputAsset): ChunkMetadata {
    return this.chunkId(chunk.fileName)
  }

  chunkId(file: string): ChunkMetadata {
    if (!this.chunkMetadata[file]) {
      this.chunkMetadata[file] = {
        importedAssets: new Set(),
        importedCss: new Set(),
      }
    }

    return this.chunkMetadata[file]
  }
}
