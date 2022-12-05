import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    // make cannot emit light.wasm
    // and emit add.wasm
    assetsInlineLimit: 80,
  },
})
