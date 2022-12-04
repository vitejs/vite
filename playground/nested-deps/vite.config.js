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
      'test-package-d    > test-package-d-nested',
      'test-package-e > test-package-e-included',
    ],
    exclude: ['test-package-d', 'test-package-e-excluded'],
  },
}
