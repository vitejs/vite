import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 9606,
    proxy: {
      '/nonExistentApp': {
        target: 'http://localhost:9607',
        bypass: () => {
          return false
        },
      },
    },
  },
})
