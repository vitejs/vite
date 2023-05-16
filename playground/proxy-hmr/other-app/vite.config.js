import { defineConfig } from 'vite'

export default defineConfig({
  base: '/anotherApp',
  server: {
    port: 3001,
    strictPort: true,
  },
})
