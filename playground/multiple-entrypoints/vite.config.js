import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: {
        a0: resolve(__dirname, 'entrypoints/a0.js'),
        a1: resolve(__dirname, 'entrypoints/a1.js'),
        a2: resolve(__dirname, 'entrypoints/a2.js'),
        a3: resolve(__dirname, 'entrypoints/a3.js'),
        a4: resolve(__dirname, 'entrypoints/a4.js'),
        a5: resolve(__dirname, 'entrypoints/a5.js'),
        a6: resolve(__dirname, 'entrypoints/a6.js'),
        a7: resolve(__dirname, 'entrypoints/a7.js'),
        a8: resolve(__dirname, 'entrypoints/a8.js'),
        a9: resolve(__dirname, 'entrypoints/a9.js'),
        a10: resolve(__dirname, 'entrypoints/a10.js'),
        a11: resolve(__dirname, 'entrypoints/a11.js'),
        a12: resolve(__dirname, 'entrypoints/a12.js'),
        a13: resolve(__dirname, 'entrypoints/a13.js'),
        a14: resolve(__dirname, 'entrypoints/a14.js'),
        a15: resolve(__dirname, 'entrypoints/a15.js'),
        a16: resolve(__dirname, 'entrypoints/a16.js'),
        a17: resolve(__dirname, 'entrypoints/a17.js'),
        a18: resolve(__dirname, 'entrypoints/a18.js'),
        a19: resolve(__dirname, 'entrypoints/a19.js'),
        a20: resolve(__dirname, 'entrypoints/a20.js'),
        a21: resolve(__dirname, 'entrypoints/a21.js'),
        a22: resolve(__dirname, 'entrypoints/a22.js'),
        a23: resolve(__dirname, 'entrypoints/a23.js'),
        a24: resolve(__dirname, 'entrypoints/a24.js'),
        index: resolve(__dirname, './index.html'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
})
