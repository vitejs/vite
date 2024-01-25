import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig(({ isPreview }) => ({
  ...baseConfig,
  base: !isPreview ? './' : '/relative-base/', // relative base to make dist portable
  build: {
    ...baseConfig.build,
    outDir: 'dist/relative-base',
    watch: null,
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'entries/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'other-assets/[name]-[hash][extname]',
      },
    },
  },
  cacheDir: 'node_modules/.vite-relative-base',
}))
