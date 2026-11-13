import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig(({ isPreview }) => ({
  input: {
    index: path.resolve(import.meta.dirname, 'exclude-polyfills.html'),
  },
  base: !isPreview ? './' : '/exclude-polyfills/',
  plugins: [
    legacy({
      modernPolyfills: true,
      excludeModernPolyfills: ['es.object.group-by'],
      excludeLegacyPolyfills: [/\.to-sorted\.js$/],
    }),
  ],
  build: {
    outDir: 'dist/exclude-polyfills',
    minify: false,
  },
}))
