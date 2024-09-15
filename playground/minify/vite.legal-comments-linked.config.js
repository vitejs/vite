import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'linked',
    minifySyntax: false,
  },
  build: {
    outDir: 'dist/linked',
  },
})
