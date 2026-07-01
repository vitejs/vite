import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  base: './',
  plugins: [
    legacy({
      targets: 'IE 11',
      modernPolyfills: true,
    }),
  ],

  build: {
    // outDir: 'dist/mpa',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'mpa/index.html'),
        'only-element': path.resolve(__dirname, 'mpa/only-element.html'),
      },
    },
  },
})
