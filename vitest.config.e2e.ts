import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./scripts/vitestSetup.ts'],
    globalSetup: ['./scripts/vitestGlobalSetup.ts'],
    testTimeout: process.env.CI ? 50000 : 20000,
    globals: true,
    reporters: 'dot'
  },
  esbuild: {
    target: 'node14'
  }
})
