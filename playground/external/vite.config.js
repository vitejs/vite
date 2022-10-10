import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: ['dep-that-imports', 'dep-that-requires'],
    exclude: ['vue', 'slash']
  },
  build: {
    minify: false,
    rollupOptions: {
      external: ['vue', 'slash']
    },
    commonjsOptions: {
      esmExternals: ['vue', 'slash']
    }
  }
})
