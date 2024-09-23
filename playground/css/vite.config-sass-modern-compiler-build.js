import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/sass-modern-compiler-build',
    rollupOptions: {
      input: {
        entry1: path.join(
          import.meta.dirname,
          'sass-modern-compiler-build/entry1.scss',
        ),
        entry2: path.join(
          import.meta.dirname,
          'sass-modern-compiler-build/entry2.scss',
        ),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
