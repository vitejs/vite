import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

export default defineConfig(({ isPreview }) => ({
  base: !isPreview ? './' : '/relative-base/',
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  worker: {
    format: 'es',
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
    outDir: 'dist/relative-base',
    assetsInlineLimit: 100, // keep SVG as assets URL
    rollupOptions: {
      output: {
        assetFileNames: 'other-assets/[name]-[hash].[ext]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
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
  cacheDir: 'node_modules/.vite-relative-base',
}))
