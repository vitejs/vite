import { defineConfig } from 'vite'

// Faithful FBM port of Vite's HTML-edit full-reload case.
// vite ref: playground/hmr/__tests__/hmr.spec.ts `test('HTML')` (L789-801) +
//   `test('full-reload encodeURI path')` (L307-320), and the counter playground
//   (playground/hmr/counter/index.html + index.ts).
//
// HTML is the dev-server entry, not an importable module: Vite's non-FBM dev does a
// FULL PAGE RELOAD when index.html is edited (hmr.ts:624-638). The ONLY intended
// change vs. the non-FBM case is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
