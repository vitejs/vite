import { Plugin } from '../plugin'

export function manifestPlugin(): Plugin {
  type Manifest = Record<string, { file: string; imports?: string[] }>
  const manifestList: Manifest[] = []

  return {
    name: 'vite:manifest',
    generateBundle(_options, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        const manifest: Manifest = {}
        if (chunk.type === 'chunk') {
          if (chunk.isEntry) {
            manifest[chunk.name + '.js'] = {
              file: chunk.fileName,
              imports: chunk.imports
            }
            manifestList.push(manifest)
          }
        } else if (chunk.name) {
          manifest[chunk.name] = { file: chunk.fileName }
          manifestList.push(manifest)
        }
      }

      this.emitFile({
        fileName: 'manifest.json',
        type: 'asset',
        source: JSON.stringify(manifestList, null, 2)
      })
    }
  }
}
