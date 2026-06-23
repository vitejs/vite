import { defineConfig } from 'vite'

// FBM (full-bundle mode) is env-toggled so the baseline (--no-fbm → VITE_NO_FBM=1)
// and the FBM run share one config; the only difference is `bundledDev`.
export default defineConfig({
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
