import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  // FBM toggle: bundledDev ON by default; the driver's --no-fbm baseline sets
  // VITE_NO_FBM=1 so both runs share one config and only bundledDev differs.
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
