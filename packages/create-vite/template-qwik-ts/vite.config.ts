import { defineConfig } from 'vite'
import { qwikVite } from '@qwik.dev/core/optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
  ],
})
