import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./scripts/vitestSetup.ts'],
    globalSetup: ['./scripts/vitestGlobalSetup.ts'],
    testTimeout: process.env.CI ? 50000 : 20000,
    globals: true,
    reporters: 'dot',
    onConsoleLog(log, type) {
      if (log.match(/experimental|jit engine|emitted file/i)) return false
    }
  },
  esbuild: {
    target: 'node14'
  }
})
