const path = require('path')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  alias: [
    { find: 'fs', replacement: path.resolve(__dirname, 'test.js') },
    { find: 'fs-dir', replacement: path.resolve(__dirname, 'dir') },
    { find: 'dep', replacement: 'test-resolve-target' },
    {
      find: /^regex\/(.*)/,
      replacement: `${path.resolve(__dirname, 'dir')}/$1`
    }
  ]
}
