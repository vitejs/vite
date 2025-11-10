import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    // make cannot emit light.wasm
    assetsInlineLimit: 80,
  },
})
