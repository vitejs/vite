import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'
import { chunkToEmittedCssFileMap } from '../plugins/css'

export function ssrManifestPlugin(config: ResolvedConfig): Plugin {
  // module id => preload assets mapping
  const ssrManifest: Record<string, string[]> = {}
  const base = config.base

  return {
    name: 'vite:manifest',
    generateBundle(_options, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk' && !chunk.isEntry) {
          // links for entry chunks are already generated in static HTML
          // so we only need to record info for non-entry chunks
          // TODO: also include non-CSS assets
          const cssFileHandle = chunkToEmittedCssFileMap.get(chunk)
          const cssFile = cssFileHandle && this.getFileName(cssFileHandle)
          for (const id in chunk.modules) {
            const mappedChunks = ssrManifest[id] || (ssrManifest[id] = [])
            mappedChunks.push(base + chunk.fileName)
            if (cssFile) {
              mappedChunks.push(base + cssFile)
            }
          }
        }
      }

      this.emitFile({
        fileName: 'ssr-manifest.json',
        type: 'asset',
        source: JSON.stringify(ssrManifest, null, 2)
      })
    }
  }
}
