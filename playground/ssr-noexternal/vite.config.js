import { defineConfig } from 'vite'

const noExternal = ['@vitejs/test-require-external-cjs']
export default defineConfig({
  ssr: {
    noExternal,
    external: ['@vitejs/test-external-cjs'],
    optimizeDeps: {
      include: noExternal,
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      external: ['@vitejs/test-external-cjs'],
    },
  },
})
