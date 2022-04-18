const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')
const path = require('path')

module.exports = vite.defineConfig({
  base: '/es/',
  enforce: 'pre',
  worker: {
    format: 'es',
    plugins: [vueJsx()],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  build: {
    outDir: 'dist/es',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/asset.[name].[ext]',
        chunkFileNames: 'assets/chunk.[name].js',
        entryFileNames: 'assets/entry.[name].js'
      }
    }
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
