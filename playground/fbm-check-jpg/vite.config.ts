import { defineConfig } from 'vite'

// Faithful FBM port of Vite's static-asset URL-import case (playground/assets,
// "asset imports from js" → `import url from './nested/asset.png'`), here for the
// `.jpg` / `.jpeg` image types. The ONLY intended change vs. the non-FBM playground
// is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
