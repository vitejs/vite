import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Opt in to the future secure default.
    // https://vite.dev/blog/announcing-vite8-4#allow-list-based-file-serve-check
    fs: {
      strict: 'extended',
      allow: [],
    },
  },
})
