import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~utils': resolve(__dirname, './playground/test-utils')
    }
  },
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./scripts/vitestSetup.ts'],
    globalSetup: ['./scripts/vitestGlobalSetup.ts'],
    testTimeout: process.env.CI ? 50000 : 20000,
    globals: true,
    reporters: 'dot',
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
    maxThreads: process.env.CI ? 1 : undefined,
    minThreads: process.env.CI ? 1 : undefined
  },
  esbuild: {
    target: 'node14'
  }
})
