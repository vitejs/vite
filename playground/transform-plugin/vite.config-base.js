import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  base: '/vite/',
})
