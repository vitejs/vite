const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')

module.exports = vite.defineConfig((sourcemap) => {
  sourcemap = process.env.WORKER_MODE || sourcemap
  if (sourcemap === 'sourcemap') {
    sourcemap = true
  }
  return {
    base: `/iife-${
      typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
    }/`,
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
      outDir: `dist/iife-${
        typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
      }/`,
      sourcemap: sourcemap,
      rollupOptions: {
        output: {
          assetFileNames: 'other-assets/[name]-[hash].[ext]',
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: 'entries/[name]-[hash].js'
        }
      }
    }
  }
})
