import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node16',
    outDir: 'dist',
    lib: {
      entry: 'main.ts',
      formats: ['cjs'],
      fileName: 'main'
    },
    rollupOptions: {
      external: ['worker_threads', 'path']
    },
    emptyOutDir: true
  }
})
