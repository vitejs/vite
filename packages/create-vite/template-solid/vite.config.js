import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [solid()],
  server: {
    // Opt in to the future secure default.
    // https://vite.dev/blog/announcing-vite8-4#allow-list-based-file-serve-check
    fs: {
      strict: 'extended',
      allow: [],
    },
  },
})
