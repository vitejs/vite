const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')
const path = require('path')
module.exports = vite.defineConfig({
  base: '/lib/',
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
    outDir: 'dist/lib',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js'
      }
    },
    lib: {
      entry: path.resolve(__dirname, 'worker/lib.js'),
      formats: ['es']
    }
  }
})
