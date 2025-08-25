import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  base: './', // Create a base for dist files 
  plugins: [react()],
  assetsInclude: ['**/*.svg'], // Ensure SVGs are bundled
});