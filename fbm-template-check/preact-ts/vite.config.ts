import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  // FBM toggle: bundledDev on by default; the driver's --no-fbm baseline sets VITE_NO_FBM=1.
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
