import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/my-counter.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: /^@microsoft\/fast-element/
    }
  }
})
