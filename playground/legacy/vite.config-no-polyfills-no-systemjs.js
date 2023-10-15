import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      renderModernChunks: false,
      polyfills: false,
      externalSystemJS: true,
    }),
    {
      name: 'remove crossorigin attribute',
      transformIndexHtml: (html) => html.replaceAll('crossorigin', ''),
      enforce: 'post',
    },
  ],

  build: {
    outDir: 'dist/no-polyfills-no-systemjs',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'no-polyfills-no-systemjs.html'),
      },
    },
  },
  testConfig: {
    previewBase: '/no-polyfills-no-systemjs/',
  },
})
