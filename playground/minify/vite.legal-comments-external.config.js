import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'external',
    minifySyntax: false,
  },
  build: {
    outDir: 'dist/external',
  },
})
