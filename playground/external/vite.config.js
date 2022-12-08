import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: ['dep-that-imports', 'dep-that-requires'],
    exclude: ['vue', 'slash5'],
  },
  build: {
    minify: false,
    rollupOptions: {
      external: ['vue', 'slash3', 'slash5'],
    },
    commonjsOptions: {
      esmExternals: ['vue', 'slash5'],
    },
  },
})
