import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'
import workerPluginStatePlugin from './worker-plugin-state-plugin'

export default defineConfig({
  base: '/serial/',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'iife',
    plugins: () => [workerPluginTestPlugin(), workerPluginStatePlugin()],
    rollupOptions: {
      output: {
        assetFileNames: 'assets/worker_asset-[name].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name].js',
        entryFileNames: 'assets/worker_entry-[name].js',
      },
    },
  },
  build: {
    outDir: 'dist/parallel',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [workerPluginTestPlugin()],
  cacheDir: 'node_modules/.vite-es',
})
