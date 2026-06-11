import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      input: ['./src/app.js'],
    },
  },
  environments: {
    client: {
      isBundled: true,
    },
    ssr: {
      isBundled: true,
    },
  },
})
