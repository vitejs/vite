import { defineConfig } from 'vitest/config'

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
    // node14 segfaults often with threads
    threads: !process.versions.node.startsWith('14'),
  },
  esbuild: {
    target: 'node14',
  },
})
