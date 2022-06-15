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
      fileName: 'my-vue-lib'
    },
    rollupOptions: {
      external: ['vue'],
      output: [
        {
          globals: { vue: 'Vue' },
          format: 'es',
          assetFileNames: `subdir1/assets.[name].[ext]`,
          entryFileNames: `subdir1/entry.[name].js`,
          chunkFileNames: `subdir1/chunk.[name].js`
        },
        {
          globals: { vue: 'Vue' },
          format: 'es',
          assetFileNames: `subdir2/assets.[name].[ext]`,
          entryFileNames: `subdir2/entry.[name].js`,
          chunkFileNames: `subdir2/chunk.[name].js`
        },
        {
          globals: { vue: 'Vue' },
          format: 'es',
          assetFileNames: `subdir3/assets.[name].[ext]`,
          entryFileNames: `subdir3/entry.[name].js`,
          chunkFileNames: `subdir3/chunk.[name].js`
        }
      ]
    }
  },
  plugins: [vue()]
})
