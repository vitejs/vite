import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig(({ isPreview }) => ({
  base: !isPreview ? './' : '/modern-target/',
  plugins: [
    legacy({
      modernPolyfills: ['es.array.at'],
      // a browser without optional catch binding
      modernTargets: ['chrome >= 64'],
      renderLegacyChunks: false,
    }),
  ],

  build: {
    outDir: 'dist/modern-target',
    rolldownOptions: {
      input: {
        index: path.resolve(import.meta.dirname, 'modern-target.html'),
      },
    },
  },
}))
