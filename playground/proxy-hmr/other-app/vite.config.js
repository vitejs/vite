import { defineConfig } from 'vite'

export default defineConfig({
  base: '/anotherApp',
  server: {
    port: 9607,
    strictPort: true,
  },
})
