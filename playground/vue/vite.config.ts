import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
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
