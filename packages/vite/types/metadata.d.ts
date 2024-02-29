export interface ChunkMetadata {
  importedAssets: Set<string>
  importedCss: Set<string>
}

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata?: ChunkMetadata
  }

  export interface CustomPluginOptions {
    vite?: {
      /**
       * The language for this module, e.g. `ts`, `tsx`, etc.
       * Used to identify if this module should resolve its `*.js` imports
       * to TypeScript files.
       */
      lang?: string
      /**
       * If this is a CSS Rollup module, you can scope to its importer's exports
       * so that if those exports are treeshaken away, the CSS module will also
       * be treeshaken. If multiple importers and exports are passed, if at least
       * one of them are bundled (and not treeshaken), then the CSS will also be bundled.
       *
       * Example config if the CSS id is `/src/App.vue?vue&type=style&lang.css`:
       * ```js
       * cssScopeTo: {
       *   '/src/App.vue': ['default']
       * }
       * ```
       */
      cssScopeTo?: Record<string, string[]>
    }
  }
}
