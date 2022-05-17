/**
 * @type {import('vite').UserConfig}
 */

const baseConfig = require('./vite.config.js')
module.exports = {
  ...baseConfig,
  base: './', // relative base to make dist portable
  build: {
    ...baseConfig.build,
    outDir: 'dist',
    watch: false,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'other-assets/[name].[hash][extname]'
      }
    }
  }
}
