import { defineConfig } from 'vite'
import workerPluginTestPlugin from './worker-plugin-test-plugin'

export default defineConfig({
  base: '/es/',
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
        assetFileNames: 'assets/worker_asset-[name]-[hash].[ext]',
        chunkFileNames: 'assets/worker_chunk-[name]-[hash].js',
        entryFileNames: 'assets/worker_entry-[name].js',
      },
    },
  },
  build: {
    outDir: 'dist/es',
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.svg') ? false : undefined,
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
  cacheDir: 'node_modules/.vite-es',
})
