import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'

const _dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineConfig({                                                                                                                                                 
  test: {
    includ    e: ['**/__tests__/**/*.spec.[tj]s'],
    exclud  e: [
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
    target: 'node20',
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
// This configuration is for Vitest, a testing framework for Vite projects.                                                                                                                               npx vitest run -t gre
// It sets up the test environment, specifies which files to include and exclude, and configures module resolution. The test timeout is set to 20 seconds, and it uses Node.js version 20 as the target for ESBuild. The public directory is disabled, and an alias is created for the Vite module runner. This configuration is useful for running tests in a Vite-based project.
// The `isolate` option is set to false, allowing tests to share the same environment                                                                                                                                                                                                                                                                                                                                                                                                                                                           