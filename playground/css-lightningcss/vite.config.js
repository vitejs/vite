import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'nested'),
    },
  },
  build: {
    cssTarget: ['chrome61'],
    cssMinify: 'lightningcss',
  },
  plugins: [testLightningcssVisitorDuringMinify()],
})

function testLightningcssVisitorDuringMinify() {
  let mediaQueryVisits = 0

  return {
    name: 'test-lightningcss-visitor-during-minify',
    apply: 'build',
    config() {
      return {
        css: {
          lightningcss: {
            visitor: {
              MediaQuery(query) {
                mediaQueryVisits++
                return query
              },
            },
          },
        },
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'media-query-visits.txt',
        source: String(mediaQueryVisits),
      })
    },
  }
}
