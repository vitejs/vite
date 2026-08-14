import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.ts'

export default defineConfig(
  mergeConfig(baseConfig, {
    base: '/nested-base/',
  }),
)
