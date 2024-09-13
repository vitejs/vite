import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'inline',
    minifySyntax: false,
  },
  build: {
    outDir: 'dist/inline',
  },
})
