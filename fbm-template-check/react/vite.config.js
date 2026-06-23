import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
