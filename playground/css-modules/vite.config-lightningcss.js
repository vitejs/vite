import { resolve } from 'node:path'
import { Features } from 'lightningcss'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  css: {
    devSourcemap: true,
    transformer: 'lightningcss',
    lightningcss: {
      include: Features.Nesting,
      cssModules: {
        dashedIdents: true,
      },
    },
  },
  build: {
    // Prevents CSS minification from handling the de-duplication of classes
    minify: false,
    rollupOptions: {
      input: {
        lightningcss: resolve(__dirname, 'lightningcss.html'),
      },
    },
  },
})
