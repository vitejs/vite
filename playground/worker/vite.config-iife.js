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
    plugins: () => [workerPluginTestPlugin()],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset-[name]-[hash].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name]-[hash].js',
        // should be overwritten to worker_entry-[name] by the config-test plugin
        entryFileNames: 'assets/worker_-[name].js',
      },
    },
  },
  build: {
    outDir: 'dist/iife',
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.svg') ? false : undefined,
    manifest: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
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
  cacheDir: 'node_modules/.vite-iife',
  optimizeDeps: {
    exclude: ['@vitejs/test-dep-self-reference-url-worker'],
  },
})
