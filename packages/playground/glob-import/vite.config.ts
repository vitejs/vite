import path from 'path'
import { defineConfig, Plugin } from 'vite'
import { init, parse } from 'es-module-lexer'

export default defineConfig({
  resolve: {
    alias: {
      '@dir': path.resolve(__dirname, './dir/')
    }
  },
  plugins: [customModifierPlugin()]
})

function customModifierPlugin() {
  const metaRE = /(\?|&)meta(?:&|$)/
  return {
    name: 'custom-modifier',
    async transform(src, id) {
      if (!metaRE.test(id)) {
        return
      }

      const exportNames = await getExportNames(src)

      const code = `export const exportNames = ${JSON.stringify(exportNames)};`

      return {
        code,
        map: { mappings: '' }
      }
    }
  } as Plugin
}

async function getExportNames(src: string): Promise<readonly string[]> {
  await init
  const exportNames = parse(src)[1]
  return exportNames
}
