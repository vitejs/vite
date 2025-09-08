import { defineConfig } from 'vite'

// Overriding the NODE_ENV set by vitest
process.env.NODE_ENV = ''

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ['@vitejs/test-dep-no-discovery'],
  },

  build: {
    // to make tests faster
    minify: false,
  },
})
