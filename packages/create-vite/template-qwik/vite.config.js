import { qwikVite } from '@builder.io/qwik/optimizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
  ],
  server: {
    // Opt in to the future secure default.
    // https://vite.dev/blog/announcing-vite8-4#allow-list-based-file-serve-check
    fs: {
      strict: 'extended',
      allow: [],
    },
  },
})
