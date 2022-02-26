import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: __dirname,
  build: {
    outDir: 'dist/lib',
    lib: {
      entry: path.resolve(__dirname, 'src-lib/index.ts'),
      name: 'MyVueLib',
      formats: ['es'],
      fileName: (format) => `my-vue-lib.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' }
      }
    }
  },
  plugins: [vue()]
})
