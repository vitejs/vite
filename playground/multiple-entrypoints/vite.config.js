import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const dirname = import.meta.dirname

export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: {
        a0: resolve(dirname, 'entrypoints/a0.js'),
        a1: resolve(dirname, 'entrypoints/a1.js'),
        a2: resolve(dirname, 'entrypoints/a2.js'),
        a3: resolve(dirname, 'entrypoints/a3.js'),
        a4: resolve(dirname, 'entrypoints/a4.js'),
        a5: resolve(dirname, 'entrypoints/a5.js'),
        a6: resolve(dirname, 'entrypoints/a6.js'),
        a7: resolve(dirname, 'entrypoints/a7.js'),
        a8: resolve(dirname, 'entrypoints/a8.js'),
        a9: resolve(dirname, 'entrypoints/a9.js'),
        a10: resolve(dirname, 'entrypoints/a10.js'),
        a11: resolve(dirname, 'entrypoints/a11.js'),
        a12: resolve(dirname, 'entrypoints/a12.js'),
        a13: resolve(dirname, 'entrypoints/a13.js'),
        a14: resolve(dirname, 'entrypoints/a14.js'),
        a15: resolve(dirname, 'entrypoints/a15.js'),
        a16: resolve(dirname, 'entrypoints/a16.js'),
        a17: resolve(dirname, 'entrypoints/a17.js'),
        a18: resolve(dirname, 'entrypoints/a18.js'),
        a19: resolve(dirname, 'entrypoints/a19.js'),
        a20: resolve(dirname, 'entrypoints/a20.js'),
        a21: resolve(dirname, 'entrypoints/a21.js'),
        a22: resolve(dirname, 'entrypoints/a22.js'),
        a23: resolve(dirname, 'entrypoints/a23.js'),
        a24: resolve(dirname, 'entrypoints/a24.js'),
        index: resolve(dirname, './index.html'),
      },
    },
  },
})
