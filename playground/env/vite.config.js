import { defineConfig } from 'vite'

export default defineConfig({
  base: '/env/',
  envPrefix: ['VITE_', 'CUSTOM_PREFIX_'],
  build: {
    outDir: 'dist/env'
  }
})
