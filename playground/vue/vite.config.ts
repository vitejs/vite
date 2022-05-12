import { defineConfig, splitVendorChunkPlugin } from 'vite'
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
    splitVendorChunkPlugin(),
    vueI18nPlugin,
    {
      name: 'resolve module',

      resolveId(id) {
        if (id === 'resolve virtual module') {
          return 'virtual:module'
        }
      },

      load(id) {
        if (id === 'virtual:module') {
          return `export default "resolve virtual module: ok"`
        }
      }
    }
  ],
  build: {
    // to make tests faster
    minify: false,
    rollupOptions: {
      output: {
        // Test splitVendorChunkPlugin composition
        manualChunks(id) {
          if (id.includes('src-import')) {
            return 'src-import'
          }
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
