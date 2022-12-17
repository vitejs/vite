const vite = require('vite')
const workerPluginTestPlugin = require('./worker-plugin-test-plugin')

module.exports = vite.defineConfig({
  base: '/es/',
  enforce: 'pre',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'es',
    plugins: [workerPluginTestPlugin()],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset-[name].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name].js',
        entryFileNames: 'assets/worker_entry-[name].js',
      },
    },
  },
  build: {
    outDir: 'dist/es',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [
    workerPluginTestPlugin(),
    {
      name: 'resolve-format-es',

      transform(code, id) {
        if (id.includes('main.js')) {
          return code.replace(
            `/* flag: will replace in vite config import("./format-es.js") */`,
            `import("./main-format-es")`,
          )
        }
      },
    },
  ],
})
