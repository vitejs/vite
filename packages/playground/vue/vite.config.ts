import path from 'path'
import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { vueI18nPlugin } from './CustomBlockPlugin'
import { moveToVendorChunkFn } from 'vite'

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
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: (id, api) => {
          if (id.includes('node_modules') && id.includes('vue')) {
            return 'vue-chunk'
          }
          // call vite's default manualChunks
          return moveToVendorChunkFn(id, api)
        }
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
})
