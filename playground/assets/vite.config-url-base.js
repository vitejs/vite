/**
 * @type {import('vite').UserConfig}
 */

const { DEFAULT_PREVIEW_PORT } = require('vite')

const baseConfig = require('./vite.config.js')
module.exports = {
  ...baseConfig,
  base: 'http://localhost:4173/',
  build: {
    ...baseConfig.build,
    outDir: 'dist/url-base',
    watch: false,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'other-assets/[name]-[hash][extname]',
      },
    },
  },
  testConfig: {
    baseRoute: '/url-base/',
  },
}
