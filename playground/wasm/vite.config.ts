import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    // make can no emit light.wasm
    // and emit add.wasm
    assetsInlineLimit: 80
  }
})
