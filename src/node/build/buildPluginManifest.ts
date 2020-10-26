import { Plugin } from 'rollup'

export const createBuildManifestPlugin = (): Plugin => {
  const manifest: Record<string, string> = {}
  return {
    name: 'vite:manifest',
    generateBundle(_options, bundle) {
      for (const name in bundle) {
        const chunk = bundle[name]
        if (chunk.type === 'chunk') {
          manifest[chunk.name + '.js'] = chunk.fileName
        } else {
          manifest[chunk.name!] = chunk.fileName
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
