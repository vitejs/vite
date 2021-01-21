import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'

export function manifestPlugin(config: ResolvedConfig): Plugin {
  const manifest: Record<
    string,
    {
      file: string
      imports?: string[],
      dynamicImports?: string[]
    }
  > = {}

  let outputCount = 0

  return {
    name: 'vite:manifest',
    generateBundle({ format }, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          if (chunk.isEntry || chunk.isDynamicEntry) {
            const name =
              format === 'system' && !chunk.name.includes('-legacy')
                ? chunk.name + '-legacy'
                : chunk.name
            manifest[name + '.js'] = {
              file: chunk.fileName,
              imports: chunk.imports,
              dynamicImports: chunk.dynamicImports
            }
          }
        } else if (chunk.name) {
          manifest[chunk.name] = { file: chunk.fileName }
        }
      }

      outputCount++
      const output = config.build.rollupOptions?.output
      const outputLength = Array.isArray(output) ? output.length : 1
      if (outputCount >= outputLength) {
        this.emitFile({
          fileName: `manifest.json`,
          type: 'asset',
          source: JSON.stringify(manifest, null, 2)
        })
      }
    }
  }
}
