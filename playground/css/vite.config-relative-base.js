/**
 * @type {import('vite').UserConfig}
 */

let totalSize = 0
const baseConfig = require('./vite.config.js')
module.exports = {
  ...baseConfig,
  base: './', // relative base to make dist portable
  build: {
    ...baseConfig.build,
    outDir: 'dist/relative-base',
    watch: false,
    minify: false,
    assetsInlineLimit: (_file, fileSize, combinedSize) => {
      totalSize += fileSize
      return true && totalSize === combinedSize + fileSize
    },
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'other-assets/[name].[hash][extname]'
      }
    }
  },
  testConfig: {
    baseRoute: '/relative-base/'
  }
}
