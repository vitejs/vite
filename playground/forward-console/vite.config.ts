import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    forwardConsole: true,
    hmr: {
      runtimeErrors: true,
    },
  },
})
