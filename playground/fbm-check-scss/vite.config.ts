import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `.scss` (Sass) HMR case (playground/css, sass-tests.ts).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
