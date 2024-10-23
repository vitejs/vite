import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
  ],
})
