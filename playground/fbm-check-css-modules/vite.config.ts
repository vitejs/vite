import { defineConfig } from 'vite'

// Faithful FBM port of Vite's CSS Modules HMR case (playground/css, tests.ts
// `test('css modules')` L166-182). The ONLY intended change vs. the non-FBM
// playground is enabling FBM. The `css.modules.generateScopedName` mirrors the
// css playground's vite.config.js (L82-83) so the hashed class name matches the
// same `mod-module__apply-color___[hash]` shape the Vite test asserts.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
})
