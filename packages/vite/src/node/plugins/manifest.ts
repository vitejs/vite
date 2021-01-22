import path from 'path'
import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'

type Manifest = Record<string, ManifestEntry>

interface ManifestEntry {
  file: string
  facadeModuleId?: string
  isEntry?: boolean
  isDynamicEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
}

export function manifestPlugin(config: ResolvedConfig): Plugin {
  const manifest: Manifest = {}

  let outputCount = 0

  return {
    name: 'vite:manifest',
    generateBundle({ format }, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk') {
          if (chunk.isEntry || chunk.isDynamicEntry) {
            let name =
              format === 'system' && !chunk.name.includes('-legacy')
                ? chunk.name + '-legacy'
                : chunk.name
            let dedupeIndex = 0
            while (name + '.js' in manifest) {
              name = `${name}-${++dedupeIndex}`
            }
            const entry: ManifestEntry = {
              isEntry: chunk.isEntry,
              isDynamicEntry: chunk.isDynamicEntry,
              file: chunk.fileName,
              imports: chunk.imports,
              dynamicImports: chunk.dynamicImports
            }

            if (
              chunk.facadeModuleId &&
              chunk.facadeModuleId.startsWith(config.root)
            ) {
              entry.facadeModuleId = chunk.facadeModuleId.slice(
                config.root.length + 1
              )
            }

            manifest[name + '.js'] = entry
          }
        } else if (chunk.name) {
          const ext = path.extname(chunk.name) || ''
          let name = chunk.name.slice(0, -ext.length)
          let dedupeIndex = 0
          while (name + ext in manifest) {
            name = `${name}-${++dedupeIndex}`
          }
          manifest[name + ext] = { file: chunk.fileName }
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
