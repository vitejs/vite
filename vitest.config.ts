import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.{spec,test}.[tj]s'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './playground/**/*.*',
      './playground-temp/**/*.*',
    ],
    testTimeout: 20000,
  },
  esbuild: {
    target: 'node18',
  },
})
