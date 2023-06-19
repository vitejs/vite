import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      drafts: { nesting: true },
    },
  },
  build: {
    cssTarget: ['chrome61'],
    cssMinify: 'lightningcss',
  },
})
