import { defineConfig } from 'vite'
import postcssNested from 'postcss-nested'

// Faithful FBM port of Vite's PostCSS case (playground/css, tests.ts
// `test('postcss config', ...)`). Vite has no dedicated `.pcss`/`.postcss`
// HMR spec — PostCSS runs inline inside `compileCSS` on every CSS module
// regardless of extension, driven by a postcss config + plugins. The css
// playground wires `postcss-nested` via a sibling `postcss.config.js`; here we
// wire the SAME plugin inline (equivalent) so the `.pcss` source is processed
// by a genuine PostCSS transform (nesting flattening).
//
// The ONLY intended change vs. a non-FBM playground is enabling FBM.
export default defineConfig({
  css: {
    postcss: {
      plugins: [postcssNested()],
    },
  },
  experimental: {
    bundledDev: true,
  },
})
