const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig({
  base: '/iife/',
  worker: {
    format: 'iife',
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
    outDir: 'dist/iife',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js'
      }
    }
  }
})
