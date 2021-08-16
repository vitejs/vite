import { defineConfig } from 'vite'
import { builtinModules } from 'module'

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
      external: [...builtinModules]
    },
    emptyOutDir: true
  }
})

export const serveConfig = defineConfig({
  build: {
    target: 'node16',
    outDir: 'dist',
    lib: {
      entry: 'main.ts',
      formats: ['cjs'],
      fileName: 'main'
    },
    rollupOptions: {
      external: [...builtinModules]
    },
    minify: false,
    emptyOutDir: true
  }
})
