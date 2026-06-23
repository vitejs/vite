import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
