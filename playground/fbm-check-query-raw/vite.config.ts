import { defineConfig } from 'vite'

// Faithful FBM port of Vite's GENERAL (non-CSS) `?raw` case (playground/assets —
// `?raw import`: `import rawSvg from './nested/fragment.svg?raw'` and
// `import rawHtml from './nested/partial.html?raw'`).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
