import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const dirname = import.meta.dirname

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(dirname, './index.html'),
        other: resolve(dirname, './other.js'),
        style2: resolve(dirname, './style2.js'),
        'shared-css-with-js': resolve(dirname, 'shared-css-with-js.html'),
        'shared-css-no-js': resolve(dirname, 'shared-css-no-js.html'),
      },
      output: {
        // manualChunks(id) {
        //   // make `chunk.css` it's own chunk for easier testing of pure css chunks
        //   if (id.includes('chunk.css')) {
        //     return 'chunk'
        //   }
        // },
        codeSplitting: {
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
