import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
        other: resolve(__dirname, './other.js'),
        style2: resolve(__dirname, './style2.js'),
        'shared-css-with-js': resolve(__dirname, 'shared-css-with-js.html'),
        'shared-css-no-js': resolve(__dirname, 'shared-css-no-js.html'),
      },
      experimental: {
        // set this to keep the previous chunking behavior to make tests pass easier
        // as some tests relies on the chunking behavior
        // (using advancedChunks enable this)
        // related: https://github.com/vitejs/vite/pull/18652
        strictExecutionOrder: false,
      },
      output: {
        // manualChunks(id) {
        //   // make `chunk.css` it's own chunk for easier testing of pure css chunks
        //   if (id.includes('chunk.css')) {
        //     return 'chunk'
        //   }
        // },
        advancedChunks: {
          groups: [
            // make `chunk.css` it's own chunk for easier testing of pure css chunks
            {
              name: 'chunk',
              test: 'chunk.css',
            },
          ],
        },
      },
    },
  },
})
