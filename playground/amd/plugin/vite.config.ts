import { join } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig((config) => {
  const isProduction = false // config.mode === 'production'
  return {
    base: './',
    build: {
      outDir: './dist',
      minify: isProduction,
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        input: {
          plugin: './index.ts',
        },
        output: {
          format: 'amd',
          assetFileNames: join(
            'assets',
            `[name]${isProduction ? '-[hash]' : ''}[extname]`,
          ),
          chunkFileNames: join(
            'js',
            'chunks',
            `[name]${isProduction ? '-[hash]' : ''}.mjs`,
          ),
          entryFileNames: join(
            'js',
            `[name]${isProduction ? '-[hash]' : ''}.js`,
          ),
        },
      },
    },
  }
})
