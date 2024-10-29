import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

export default defineConfig(({ isPreview }) => ({
  base: !isPreview ? './' : '/relative-base-iife/',
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
        assetFileNames: 'worker-assets/worker_asset-[name]-[hash].[ext]',
        chunkFileNames: 'worker-chunks/worker_chunk-[name]-[hash].js',
        entryFileNames: 'worker-entries/worker_entry-[name]-[hash].js',
      },
    },
  },
  build: {
    outDir: 'dist/relative-base-iife',
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.svg') ? false : undefined,
    rollupOptions: {
      output: {
        assetFileNames: 'other-assets/[name]-[hash].[ext]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
  },
  plugins: [workerPluginTestPlugin()],
  cacheDir: 'node_modules/.vite-relative-base-iife',
}))
