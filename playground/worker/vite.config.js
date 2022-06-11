const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig({
  base: '/iife/',
  worker: {
    format: 'iife',
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
    outDir: 'dist/iife',
    rollupOptions: {
      output: {
        assetFileNames: 'other-assets/[name]-[hash].[ext]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js'
      }
    }
  }
})
