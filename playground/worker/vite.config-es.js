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
    assetsInlineLimit: 100, // keep SVG as assets URL
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
  cacheDir: 'node_modules/.vite-es',
})
