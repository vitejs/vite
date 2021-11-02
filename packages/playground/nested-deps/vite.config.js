const path = require('path')
const os = require('os')
const isWindows = os.platform() === 'win32'
const packageFPath = path.resolve(__dirname, 'test-package-f')
const ensureSlash = (p) => (p.startsWith('/') ? p : `/${p}`)

/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    alias: {
      __F_ABSOLUTE_PACKAGE_PATH__: isWindows
        ? ensureSlash(packageFPath)
        : packageFPath
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
