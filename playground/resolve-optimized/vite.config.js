/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  optimizeDeps: {
    exclude: ['@vitejs/test-resolve-optimized-package-b'],
  },
  resolve: {
    // test if tryOptimizedResolve respect resolve options
    mainFields: ['custom', 'module'],
    conditions: ['custom'],
  },
}
