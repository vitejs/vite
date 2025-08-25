import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // Create a base for dist files 
  plugins: [react()],
  assetsInclude: ['**/*.svg'], // Ensure SVGs are bundled
});
