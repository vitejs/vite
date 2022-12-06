/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  optimizeDeps: {
    include: [
      '@vitejs/test-package-a',
      '@vitejs/test-package-b',
      '@vitejs/test-package-c',
      '@vitejs/test-package-c/side',
      '@vitejs/test-package-d    > @vitejs/test-package-d-nested',
      '@vitejs/test-package-e > @vitejs/test-package-e-included',
    ],
    exclude: ['@vitejs/test-package-d', '@vitejs/test-package-e-excluded'],
  },
}
