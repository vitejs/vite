import path from 'path'
import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { vueI18nPlugin } from './CustomBlockPlugin'
import { createMoveToVendorChunkFn } from 'vite'
const viteChunks = createMoveToVendorChunkFn()

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
        // partial override of vite's manualChunks
        manualChunks: (id, api) => {
          if (id.includes('node_modules') && id.includes('vue')) {
            return 'vue-chunk'
          }
          return viteChunks(id, api)
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
