import { defineConfig } from 'vite'

// Faithful FBM port of Vite's static-asset URL-import case (playground/assets,
// `import svgFrag from './nested/fragment.svg'` / `?no-inline` svg import).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
