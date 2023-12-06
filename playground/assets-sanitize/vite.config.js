import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    //speed up build
    minify: false,
    target: 'esnext',
    assetsInlineLimit: 0,
    manifest: true,
  },
})
