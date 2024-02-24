import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'

const _dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.spec.[tj]s'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './playground/**/*.*',
      './playground-temp/**/*.*',
    ],
    testTimeout: 20000,
  },
  esbuild: {
    target: 'node18',
  },
  publicDir: false,
  resolve: {
    alias: {
      'vite/runtime': path.resolve(
        _dirname,
        './packages/vite/src/runtime/index.ts',
      ),
    },
  },
})
