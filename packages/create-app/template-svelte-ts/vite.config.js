import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      // Allow imports to specify, e.g. import 'src/example'
      { find: /^src\/(.*)/, replacement: '/src/$1' }
    ]
  },
  plugins: [svelte()]
})
