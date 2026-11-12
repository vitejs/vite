import { defineConfig } from 'vite'
import baseConfig from './vite.config.ts'

export default defineConfig({
  ...baseConfig,
  base: '/foo/',
})
