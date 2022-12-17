import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vuePlugin()],
  build: {
    outDir: 'dist/preload-disabled',
    minify: 'terser',
    terserOptions: {
      format: {
        beautify: true,
      },
      compress: {
        passes: 3,
      },
    },
    modulePreload: false,
  },
})
