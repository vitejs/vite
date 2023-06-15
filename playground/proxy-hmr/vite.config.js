import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 9606,
    proxy: {
      '/anotherApp': {
        target: 'http://localhost:9607',
        ws: true,
      },
    },
  },
})
