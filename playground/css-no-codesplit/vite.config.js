import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    cssCodeSplit: false,
    rolldownOptions: {
      input: {
        index: resolve(import.meta.dirname, './index.html'),
        sub: resolve(import.meta.dirname, './sub.html'),
        // regression entry for https://github.com/vitejs/vite/issues/22301:
        // `order-static.html` imports `order-static.js` which statically
        // imports `order-static-base.css` first, then `order-static-dep.js`.
        // Because `order-static-dep.js` is also a build input, it is
        // force-split into its own chunk that owns `order-static-dep.css`.
        // The bundled CSS must place `order-static-base.css` before
        // `order-static-dep.css` to match source-import order.
        'order-static': resolve(import.meta.dirname, './order-static.html'),
        'order-static-dep': resolve(
          import.meta.dirname,
          './order-static-dep.js',
        ),
      },
    },
  },
})
