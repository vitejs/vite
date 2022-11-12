const path = require('node:path')

const trailingSlash = process.env.TRAILING_SLASH === 'false' ? false : true
const base = trailingSlash ? '/foo/' : '/foo'
const outDir = trailingSlash ? 'dist/foo' : 'dist/foo-no-trailing-slash'

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  base,
  publicDir: 'static',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'nested')
    }
  },
  assetsInclude: ['**/*.unknown'],
  build: {
    outDir,
    assetsInlineLimit: 8192, // 8kb
    manifest: true,
    watch: {}
  }
}
