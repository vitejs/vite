export interface ChunkMetadata {
  /**
   * CSS code that is extracted from the chunk.
   * This is only available in `renderChunk` hook
   * for plugins without `enforce`
   *
   * @experimental
   */
  cssContent?: string

  importedAssets: Set<string>
  importedCss: Set<string>
}

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata?: ChunkMetadata
  }
}
