import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: './src/main.js',
  },
  resolve: {
    alias: {
      '@vitejs/test-alias-original': '/src/alias-replaced.js',
      '@vitejs/test-alias-non-dep': '/src/alias-replaced.js',
      'node:process': '/src/alias-process.js',
    },
  },
})
