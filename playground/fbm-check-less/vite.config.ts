import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `.less` (Less) HMR case (playground/css, css.spec.ts).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
