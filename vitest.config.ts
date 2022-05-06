import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './packages/playground/**/*.*',
      './packages/temp/**/*.*'
    ]
  },
  build: {
    target: 'node12'
  }
})
