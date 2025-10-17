import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: './src/entry-ssr.ts',
    minify: false,
  },
  environments: {
    ssr: {
      resolve: {
        external: [/^npm:/],
      },
    },
  },
})
