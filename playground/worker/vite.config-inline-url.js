import { defineConfig } from 'vite'
import config from './vite.config-es'

export default defineConfig({
  ...config,
  base: '/inline-url/',
  worker: {
    ...config.worker,
    inlineUrl: 'base64',
  },
  build: {
    ...config.build,
    outDir: 'dist/inline-url',
  },
})
