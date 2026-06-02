import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/sass-node-builtin-clash',
    rollupOptions: {
      input: {
        entry: path.join(
          import.meta.dirname,
          'sass-node-builtin-clash/entry.scss',
        ),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.join(import.meta.dirname, 'sass-node-builtin-clash')],
      },
    },
  },
})
