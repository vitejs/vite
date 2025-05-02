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
    deps: {
      // we specify 'packages' so Vitest doesn't inline the files
      moduleDirectories: ['node_modules', 'packages'],
    },
    testTimeout: 20000,
    isolate: false,
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
