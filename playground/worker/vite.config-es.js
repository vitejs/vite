const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig({
  base: '/es/',
  enforce: 'pre',
  worker: {
    format: 'es',
    plugins: [vueJsx()],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset.[name].[ext]',
        chunkFileNames: 'assets/worker_chunk.[name].js',
        entryFileNames: 'assets/worker_entry.[name].js'
      }
    }
  },
  build: {
    outDir: 'dist/es',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js'
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
