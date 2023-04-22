import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: [
      { find: 'fs', replacement: path.resolve(__dirname, 'test.js') },
      { find: 'fs-dir', replacement: path.resolve(__dirname, 'dir') },
      { find: 'dep', replacement: '@vitejs/test-resolve-linked' },
      {
        find: /^regex\/(.*)/,
        replacement: `${path.resolve(__dirname, 'dir')}/$1`,
      },
      { find: '/@', replacement: path.resolve(__dirname, 'dir') },
      // aliasing an optimized dep
      { find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js' },
      // aliasing an optimized dep to absolute URL
      {
        find: '@vue/shared',
        replacement: require.resolve('@vue/shared/dist/shared.cjs.prod.js'),
      },
      // aliasing one unoptimized dep to an optimized dep
      { find: 'foo', replacement: 'vue' },
      {
        find: 'custom-resolver',
        replacement: path.resolve(__dirname, 'test.js'),
        customResolver(id) {
          return id.replace('test.js', 'customResolver.js')
        },
      },
    ],
  },
  build: {
    minify: false,
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: true,
  },
})
