import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    // make cannot emit light.wasm
    assetsInlineLimit: 80,
    ssr: './src/app.js',
    ssrEmitAssets: true,
  },
})
