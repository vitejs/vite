import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/anotherApp': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
