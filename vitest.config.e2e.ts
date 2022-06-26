import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import ReporterPlugin from './scripts/reporter'

const timeout = process.env.CI ? 50000 : 30000

export default defineConfig({
  resolve: {
    alias: {
      '~utils': resolve(__dirname, './playground/test-utils')
    }
  },
  plugins: [ReporterPlugin()],
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
