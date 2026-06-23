import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `?inline` / `?no-inline` cases (playground/assets —
// `import inlinePng from './nested/asset.png?inline'` asserted to be a `data:` URI,
// and `import noInlineSvg from './nested/fragment.svg?no-inline'` asserted to be a
// non-inlined asset URL).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
