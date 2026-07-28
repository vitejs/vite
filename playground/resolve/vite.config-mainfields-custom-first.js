import { defineConfig } from 'vite'
import { baseConfig } from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  resolve: {
    ...baseConfig.resolve,
    mainFields: [
      'custom',
      ...baseConfig.resolve.mainFields.filter((f) => f !== 'custom'),
    ],
  },
  build: {
    ...baseConfig.build,
    outDir: 'dist-mainfields-custom-first',
  },
})
