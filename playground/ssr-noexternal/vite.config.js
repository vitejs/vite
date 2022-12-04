import module from 'node:module'
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['@vitejs/test-require-external-cjs'],
    external: ['@vitejs/test-external-cjs'],
    optimizeDeps: {
      disabled: false,
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      external: ['@vitejs/test-external-cjs'],
    },
    commonjsOptions: {
      include: [],
    },
  },
})
