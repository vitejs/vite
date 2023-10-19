import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

export default defineConfig({
  base: '/iife/',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'iife',
    plugins: [
      workerPluginTestPlugin(),
      {
        name: 'config-test',
        config() {
          return {
            worker: {
              rollupOptions: {
                output: {
                  entryFileNames: 'assets/worker_entry-[name].js',
                },
              },
            },
          }
        },
      },
    ],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset-[name].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name].js',
        // should fix by config-test plugin
        entryFileNames: 'assets/worker_-[name].js',
      },
    },
  },
  build: {
    outDir: 'dist/iife',
    assetsInlineLimit: 100, // keep SVG as assets URL
    manifest: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [workerPluginTestPlugin()],
  cacheDir: 'node_modules/.vite-iife',
})
