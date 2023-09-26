import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

let isTestHookCalled = false

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'iife',
    plugins: [workerPluginTestPlugin()],
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
    rollupOptions: {
      output: {
        assetFileNames: 'other-assets/[name]-[hash].[ext]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
  },
  plugins: [
    {
      name: 'set-base-if-preview',
      config() {
        // TODO: use something like ConfigEnv['cmd'] https://github.com/vitejs/vite/pull/12298
        const isPreview = isTestHookCalled || process.argv.includes('preview')
        if (isPreview) {
          return {
            base: '/relative-base/',
          }
        }
      },
    },
    workerPluginTestPlugin(),
  ],
  cacheDir: 'node_modules/.vite-relative-base-iife',
  __test__() {
    // process.argv is different when running tests
    // so use this hook instead
    isTestHookCalled = true
  },
})
