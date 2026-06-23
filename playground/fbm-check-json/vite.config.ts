import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `.json` case (playground/json).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
