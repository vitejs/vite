import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.ts'

export default defineConfig((env) =>
  mergeConfig(baseConfig(env), {
    experimental: { hmrPartialAccept: false },
  }),
)
