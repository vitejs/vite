const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')
const path = require('path')

module.exports = vite.defineConfig({
  base: '/es/',
  enforce: 'pre',
  worker: {
    format: 'es',
    plugins: [vueJsx()]
  },
  build: {
    outDir: 'dist/es'
  },
  plugins: [
    {
      name: 'resolve-format-es',

      transform(code, id) {
        if (id.includes('main.js')) {
          return code.replace(
            `/* flag: will replace in vite config import("./format-es.js") */`,
            `import("./main-format-es")`
          )
        }
      }
    }
  ]
})
