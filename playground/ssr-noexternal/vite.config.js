import module from 'node:module'
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['@vitejs/require-external-cjs'],
    external: ['@vitejs/external-cjs'],
    optimizeDeps: {
      disabled: false,
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      external: ['@vitejs/external-cjs'],
    },
    commonjsOptions: {
      include: [],
    },
  },
})
