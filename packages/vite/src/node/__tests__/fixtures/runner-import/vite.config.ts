import { defineConfig } from 'vite'
import plugin from './plugin'

export default defineConfig({
  root: './test',
  plugins: [plugin()],
})
