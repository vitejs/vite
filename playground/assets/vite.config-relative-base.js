import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

let isTestHookCalled = false

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
  cacheDir: 'node_modules/.vite-relative-base',
  __test__() {
    // process.argv is different when running tests
    // so use this hook instead
    isTestHookCalled = true
  },
  plugins: [
    {
      name: 'set-base-if-preview',
      config() {
        // TODO: use something like ConfigEnv['cmd'] https://github.com/vitejs/vite/pull/12298
        const isPreview = isTestHookCalled || process.argv.includes('preview')
        if (isPreview) {
          return {
            base: '/relative-base/',
          }
        }
      },
    },
  ],
})
