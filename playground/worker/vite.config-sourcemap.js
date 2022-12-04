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
    resolve: {
      alias: {
        '@': __dirname,
      },
    },
    worker: {
      format: 'iife',
      plugins: [vueJsx()],
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-worker_asset[hash].[ext]',
          chunkFileNames: 'assets/[name]-worker_chunk[hash].js',
          entryFileNames: 'assets/[name]-worker_entry[hash].js',
        },
      },
    },
    build: {
      outDir: `dist/iife-${
        typeof sourcemap === 'boolean' ? 'sourcemap' : 'sourcemap-' + sourcemap
      }/`,
      sourcemap: sourcemap,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
  }
})
