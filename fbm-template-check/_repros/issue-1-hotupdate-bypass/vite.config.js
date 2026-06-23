import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Minimal repro for FBM Issue 1 — bundledDev bypasses plugin hotUpdate/handleHotUpdate.
// bundledDev ON by default; `VITE_NO_FBM=1` turns it OFF (the non-FBM baseline).
export default defineConfig({
  plugins: [vue()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
