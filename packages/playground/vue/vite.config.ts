import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { splitVendorPlugin } from '@vitejs/plugin-split-vendor'
import { vueI18nPlugin } from './CustomBlockPlugin'

export default defineConfig({
  resolve: {
    alias: {
      '/@': __dirname
    }
  },
  plugins: [
    vuePlugin({
      reactivityTransform: true
    }),
    splitVendorPlugin(),
    vueI18nPlugin
  ],
  build: {
    // to make tests faster
    minify: false
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
})
