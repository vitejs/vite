import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    // make can not emit light.wasm
    // and emit add.wasm
    assetsInlineLimit: 80
  }
})
