// extract the package absolute path
const { normalizePath } = require('vite');
const packageFPath = normalizePath(require.resolve('test-package-f')).replace(/(\\|\/)index.js/, '')

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    alias: {
      __F_ABSOLUTE_PACKAGE_PATH__: packageFPath
    }
  },
  optimizeDeps: {
    include: [
      'test-package-a',
      'test-package-b',
      'test-package-c',
      'test-package-c/side',
      'test-package-d    > test-package-d-nested',
      'test-package-e-included',
      packageFPath
    ],
    exclude: ['test-package-d', 'test-package-e-excluded']
  }
}
