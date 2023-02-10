// @ts-check
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  base: './', // relative base to make dist portable
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
  // @ts-expect-error refer to playground/vitestSetup.ts
  testConfig: {
    baseRoute: '/relative-base/',
  },
})
