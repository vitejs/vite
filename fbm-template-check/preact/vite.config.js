import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
