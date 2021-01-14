const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  alias: [
    { find: 'fs', replacement: path.resolve(__dirname, 'test.js') },
    { find: 'fs-dir', replacement: path.resolve(__dirname, 'dir') },
    { find: 'dep', replacement: 'resolve-linked' },
    {
      find: /^regex\/(.*)/,
      replacement: `${path.resolve(__dirname, 'dir')}/$1`
    },
    { find: '/@', replacement: path.resolve(__dirname, 'dir') },
    // aliasing an optimized dep
    { find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js' }
  ],
  build: {
    minify: false
  }
}
