const vueJsx = require('@vitejs/plugin-vue-jsx')
const vite = require('vite')
const inspect = require('vite-plugin-inspect')

module.exports = vite.defineConfig({
  base: '/iife/',
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  plugins: [inspect()],
  worker: {
    format: 'iife',
    plugins: [
      vueJsx(),
      {
        name: 'config-test',
        config() {
          return {
            worker: {
              rollupOptions: {
                output: {
                  entryFileNames: 'assets/worker_entry.[name].js'
                }
              }
            }
          }
        }
      }
    ],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset.[name].[ext]',
        chunkFileNames: 'assets/worker_chunk.[name].js',
        // should fix by config-test plugin
        entryFileNames: 'assets/worker_.[name].js'
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
