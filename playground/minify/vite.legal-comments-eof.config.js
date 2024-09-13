import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'eof',
    minifySyntax: false,
  },
  build: {
    outDir: 'dist/eof',
  },
})
