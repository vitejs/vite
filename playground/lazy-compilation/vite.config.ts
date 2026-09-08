import { defineConfig } from 'vite'

// Lazy compilation only exists in bundled dev, so this playground always runs
// with it on, also under plain `pnpm test-serve`.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
