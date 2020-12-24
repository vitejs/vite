import { Plugin } from '../plugin'

export function manifestPlugin(): Plugin {
  const manifest: Record<string, { file: string; imports?: string[] }> = {}

  return {
    name: 'vite:manifest',
    generateBundle(_options, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          if (chunk.isEntry) {
            manifest[chunk.name + '.js'] = {
              file: chunk.fileName,
              imports: chunk.imports
            }
          }
        } else if (chunk.name) {
          manifest[chunk.name] = { file: chunk.fileName }
        }
      }
      this.emitFile({
        fileName: 'manifest.json',
        type: 'asset',
        source: JSON.stringify(manifest, null, 2)
      })
    }
  }
}
