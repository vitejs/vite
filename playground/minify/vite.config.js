import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    legalComments: 'none',
    minifySyntax: false,
  },
})
