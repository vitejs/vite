import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    cssTarget: ['chrome61'],
    cssMinify: 'lightningcss',
  },
})
