import { defineConfig } from 'vite'
import baseConfig from './vite.config'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true,
      },
    },
    outDir: 'dist/terser',
    lib: {
      ...baseConfig.build.lib,
      entry: baseConfig.build.lib.entry!,
      formats: ['es'],
    },
  },
  plugins: [],
  cacheDir: 'node_modules/.vite-terser',
})
