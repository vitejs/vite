import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 50000 : 30000

export default defineConfig({
  resolve: {
    alias: {
      '~utils': resolve(__dirname, './playground/test-utils')
    }
  },
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./playground/vitestSetup.ts'],
    globalSetup: ['./playground/vitestGlobalSetup.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    globals: true,
    reporters: 'dot',
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    }
  },
  esbuild: {
    target: 'node14'
  }
})
