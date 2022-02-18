import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      '/@': __dirname
    }
  },
  plugins: [vue()],
  build: {
    // to make tests faster
    minify: false
  },
  server: {
    // This option caused issues with HMR,
    // although it should not affect the build
    origin: 'http://localhost:8080/'
  }
})
