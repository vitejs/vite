import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
