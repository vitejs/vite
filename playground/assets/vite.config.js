const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  base: '/foo/',
  publicDir: 'static',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'nested')
    }
  },
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8192, // 8kb
    manifest: true,
    watch: {}
  }
}
