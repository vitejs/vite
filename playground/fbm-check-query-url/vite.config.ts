import { defineConfig } from 'vite'

// Faithful FBM port of Vite's GENERAL `?url` case (playground/assets — `?url import`
// on a non-CSS file: `import fooUrl from './foo.js?url'`).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
