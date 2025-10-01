import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig(({ isPreview }) => ({
  base: !isPreview ? './' : '/no-polyfills/',
  plugins: [
    legacy({
      renderModernChunks: false,
      polyfills: false,
    }),
    {
      name: 'remove crossorigin attribute',
      transformIndexHtml: (html) => html.replaceAll('crossorigin', ''),
      enforce: 'post',
    },
  ],

  build: {
    outDir: 'dist/no-polyfills',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'no-polyfills.html'),
      },
    },
  },
}))
