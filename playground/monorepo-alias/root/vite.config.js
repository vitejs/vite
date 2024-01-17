import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@vitejs/test-monorepo-alias-shared': path.join(
        __dirname,
        '../shared/src',
      ),
    },
  },
  build: {
    minify: false,
  },
})
