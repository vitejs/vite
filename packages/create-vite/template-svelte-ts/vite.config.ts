import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // Opt in to the future secure default.
    // https://vite.dev/blog/announcing-vite8-4#allow-list-based-file-serve-check
    fs: {
      strict: 'extended',
      allow: [],
    },
  },
})
