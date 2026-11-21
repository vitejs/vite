import { defineConfig } from 'vite'
export default defineConfig({
  optimizeDeps: {
    include: ['@vitejs/test-wasm-dep/bare-glue'],
  },
  build: {
    // make cannot emit light.wasm
    // and emit add.wasm
    assetsInlineLimit: 80,
  },
})
