import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  experimental: {
    enableNativePlugin: 'resolver',
  },
})
