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
    // isolate: false,
    // TODO:
    // importing non entry file can be broken due to cyclic import e.g.
    //   pnpm exec tsx packages/vite/src/node/server/index.ts
    setupFiles: ['./packages/vite/src/node/index.ts'],
  },
  esbuild: {
    target: 'node18',
  },
  publicDir: false,
  resolve: {
    alias: {
      'vite/module-runner': path.resolve(
        _dirname,
        './packages/vite/src/module-runner/index.ts',
      ),
    },
  },
})
