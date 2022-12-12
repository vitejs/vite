/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  optimizeDeps: {
    exclude: ['@vitejs/test-resolve-optimized-dup-deps-package-a'],
  },
}
