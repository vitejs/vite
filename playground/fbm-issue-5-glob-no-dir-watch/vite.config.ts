import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `import.meta.glob(...)` case (playground/glob-import,
// __tests__/glob-import.spec.ts). The ONLY intended change vs. the non-FBM playground is
// enabling FBM (`experimental.bundledDev`).
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
