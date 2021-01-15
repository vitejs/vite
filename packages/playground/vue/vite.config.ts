import path from 'path'
import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { vueI18nPlugin } from './CustomBlockPlugin'

export default defineConfig({
  alias: {
    '/@': __dirname
  },
  plugins: [vuePlugin(), vueI18nPlugin],
  build: {
    // to make tests faster
    minify: false
  }
})
