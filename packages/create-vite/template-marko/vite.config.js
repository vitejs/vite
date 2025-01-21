import { defineConfig } from 'vite'
import marko from '@marko/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [marko({
    linked: false
  })]
})
