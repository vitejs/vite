import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/iife/',
  worker: {
    format: 'iife',
    plugins: [vueJsx()]
  },
  build: {
    outDir: 'dist/iife'
  }
})
