import { defineConfig } from 'vite'
import eft from 'rollup-plugin-eft'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [eft()]
})