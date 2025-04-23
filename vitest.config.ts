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
    // importing non-entry files (e.g. config.ts, build.ts, server/index.ts) is broken due to cyclic import
    // as it can be seen from tsx (try pnpm exec tsx packages/vite/src/node/server/index.ts).
    // we can use `setupFiles` to ensure the modules are evaluated via main node entry.
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
