/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  optimizeDeps: {
    include: ['test-package-a', 'test-package-b']
  }
}
