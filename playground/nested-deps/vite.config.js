import path from 'node:path'
import os from 'node:os'
import { defineConfig } from 'vite'

const isWindows = os.platform() === 'win32'
const packageFPath = path.resolve(__dirname, 'test-package-f')
const ensureSlash = (p) => (p.startsWith('/') ? p : `/${p}`)

export default defineConfig({
  resolve: {
    alias: {
      __F_ABSOLUTE_PACKAGE_PATH__: isWindows
        ? ensureSlash(packageFPath)
        : packageFPath,
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
      packageFPath,
    ],
    exclude: ['@vitejs/test-package-d', '@vitejs/test-package-e-excluded'],
  },
})
