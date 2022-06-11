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
          assetFileNames: 'assets/worker_asset.[name].[ext]',
          chunkFileNames: 'assets/worker_chunk.[name].js',
          entryFileNames: 'assets/worker_entry.[name].js'
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
          assetFileNames: 'assets/[name].[ext]',
          chunkFileNames: 'assets/[name].js',
          entryFileNames: 'assets/[name].js'
        }
      }
    }
  }
})
