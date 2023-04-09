import path from 'node:path'
import { defineConfig } from 'vite'

const packageFPath = path.resolve(__dirname, 'test-package-f')

export default defineConfig({
  resolve: {
    alias: {
      __F_ABSOLUTE_PACKAGE_PATH__: packageFPath,
    },
  },
  optimizeDeps: {
    include: [
      '@vitejs/test-package-a',
      '@vitejs/test-package-b',
      '@vitejs/test-package-c',
      '@vitejs/test-package-c/side',
      '@vitejs/test-package-d    > @vitejs/test-package-d-nested',
      '@vitejs/test-package-e > @vitejs/test-package-e-included',
      '@vitejs/test-package-f',
    ],
    exclude: ['@vitejs/test-package-d', '@vitejs/test-package-e-excluded'],
  },
})
