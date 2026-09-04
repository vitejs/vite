import { defineConfig } from 'vite'

export default defineConfig({
  base: '/shared-chunks/',
  resolve: {
    alias: {
      '@': import.meta.dirname,
    },
  },
  worker: {
    format: 'es',
    // shareChunks defaults to true - intentionally not overridden here, this
    // config exists to test that default.
  },
  build: {
    outDir: 'dist/shared-chunks',
  },
  plugins: [
    {
      // Unlike `resolve-format-es` (which adds an extra import alongside
      // worker/main.js's other scenarios), this replaces the whole entry so
      // this variant only exercises the shared-chunks fixture below -
      // keeping it isolated from the other (`shareChunks: false`) variants'
      // worker.plugins/output-naming assertions.
      name: 'resolve-shared-chunks',
      transform(code, id) {
        if (id.includes('main.js')) {
          return `import("./main-shared-chunks")`
        }
      },
    },
  ],
  cacheDir: 'node_modules/.vite-shared-chunks',
})
