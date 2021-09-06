/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  optimizeDeps: {
    include: [
      'test-package-a',
      'test-package-b',
      'test-package-c',
      'test-package-c/side',
      'test-package-d    > test-package-d-nested'
    ],
    exclude: ['test-package-d']
  }
}
