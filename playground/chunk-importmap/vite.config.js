import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkImportMap: true,
    sourcemap: true,
  },
})
