import { defineConfig } from 'vite'

// Overriding the NODE_ENV set by vitest
process.env.NODE_ENV = ''

export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: ['@vitejs/test-dep-no-discovery'],
  },

  build: {
    // to make tests faster
    minify: false,
  },
})
