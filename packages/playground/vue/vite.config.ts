import path from 'path'
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
      refTransform: true
    }),
    vueI18nPlugin
  ],
  build: {
    // to make tests faster
    // minify: false
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
})
