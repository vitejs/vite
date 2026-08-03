import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // multiple entries, including a CSS-only entry (no JS exports).
      // `build.cssCodeSplit` previously caused a crash when set to `false`.
      // `false` is the default for library builds.
      entry: [
        fileURLToPath(new URL('./index.js', import.meta.url)),

        // `.pcss` avoids a separate built-in validation that rejects literal `.css` entries when `cssCodeSplit` is `false`.
        fileURLToPath(new URL('./style-only.pcss', import.meta.url)),
      ],
      name: 'CssLibMultiEntry',
    },
  },
})
