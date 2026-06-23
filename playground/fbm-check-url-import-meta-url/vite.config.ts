import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `new URL('./asset', import.meta.url)` case
// (playground/assets, `test('new URL(..., import.meta.url)')` →
// `const metaUrl = new URL('./import-meta-url/img.png', import.meta.url)`).
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
