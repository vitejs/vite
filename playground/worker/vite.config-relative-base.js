const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')
const path = require('path')

module.exports = vite.defineConfig({
  base: './',
  enforce: 'pre',
  worker: {
    format: 'es',
    plugins: [vueJsx()],
    rollupOptions: {
      output: {
        assetFileNames: 'worker-assets/worker_asset.[name]-[hash].[ext]',
        chunkFileNames: 'worker-chunks/worker_chunk.[name]-[hash].js',
        entryFileNames: 'worker-entries/worker_entry.[name]-[hash].js'
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'other-assets/[name]-[hash].[ext]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js'
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
