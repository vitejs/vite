import { defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    resolveLocalPackageSources: true,
  },
  resolve: {
    // None!
    alias: {},
  },
})
