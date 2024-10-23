import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 9616,
    proxy: {
      '/anotherApp': {
        target: 'http://localhost:9617',
        ws: true,
      },
    },
  },
})
