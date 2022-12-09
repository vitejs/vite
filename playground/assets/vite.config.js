const path = require('node:path')

const resolve = (p) => path.resolve(__dirname, p)

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  base: '/foo',
  publicDir: 'static',
  resolve: {
    alias: {
      '@': resolve('nested'),
    },
  },
  assetsInclude: ['**/*.unknown'],
  build: {
    outDir: 'dist/foo',
    assetsInlineLimit: 8192, // 8kb
    manifest: true,
    watch: {},
    rollupOptions: {
      input: [
        resolve('./index.html'),
        resolve('./nested/index.html'),
        resolve('./non-nested.html'),
      ],
    },
  },
}
