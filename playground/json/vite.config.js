import { defineConfig } from 'rollup'

export default defineConfig({
  plugins: [speciaJsonPlugin()]
})

/**
 * @returns {import('vite').Plugin}
 */
function speciaJsonPlugin() {
  return {
    name: 'special-json-plugin',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'special.json') {
        return '\0special.json'
      }
    },
    load(id) {
      if (id === '\0special.json') {
        return `export default 'i_am_special'`
      }
    }
  }
}
