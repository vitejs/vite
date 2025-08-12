import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'none',
    minifySyntax: false,
  },
  build: {
    minify: 'esbuild',
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        legalComments: 'none',
      },
    },
  },
})
