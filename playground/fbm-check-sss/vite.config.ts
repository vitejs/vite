import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `.sss` (SugarSS) HMR case (playground/css,
// tests.ts `test('sugarss')`). The ONLY intended change vs. the non-FBM
// playground is enabling FBM. The default css.transformer ('postcss') routes
// `.sss` through the sugarss PostCSS syntax parser (css.ts:1660 `loadSss`).
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
