export interface ChunkMetadata {
  /**
   * CSS code that is extracted from the chunk.
   * This is only available in `renderChunk` hook
   * for plugins without `enforce`
   *
   * @experimental
   */
  cssContent?: string
  /** @internal */
  _cssCheckedModules?: Set<string>

  importedAssets: Set<string>
  importedCss: Set<string>
}

export interface CustomPluginOptionsVite {
  /**
   * If this is a CSS Rollup module, you can scope to its importer's exports
   * so that if those exports are treeshaken away, the CSS module will also
   * be treeshaken.
   *
   * The "importerId" must import the CSS Rollup module statically.
   *
   * Example config if the CSS id is `/src/App.vue?vue&type=style&lang.css`:
   * ```js
   * cssScopeTo: ['/src/App.vue', 'default']
   * ```
   *
   * @experimental
   */
  cssScopeTo?: [importerId: string, exportName: string | undefined]
}

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata?: ChunkMetadata
  }

  export interface CustomPluginOptions {
    vite?: CustomPluginOptionsVite
  }
}
