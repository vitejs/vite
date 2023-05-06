import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'LightningCSS',
    drafts: { nesting: true },
  },
  build: {
    cssTarget: ['chrome61'],
    cssMinifier: { minifier: 'LightningCSS' },
  },
})
