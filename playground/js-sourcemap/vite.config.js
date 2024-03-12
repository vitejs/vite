import { defineConfig } from 'vite'
import transformFooWithInlineSourceMap from './foo-with-sourcemap-plugin'
import { transformZooWithSourcemapPlugin } from './zoo-with-sourcemap-plugin'

export default defineConfig({
  plugins: [
    transformFooWithInlineSourceMap(),
    transformZooWithSourcemapPlugin(),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(name) {
          if (name.endsWith('after-preload-dynamic.js')) {
            return 'after-preload-dynamic'
          }
          if (name.endsWith('after-preload-dynamic-hashbang.js')) {
            return 'after-preload-dynamic-hashbang'
          }
        },
        banner(chunk) {
          if (chunk.name.endsWith('after-preload-dynamic-hashbang')) {
            return '#!/usr/bin/env node'
          }
        },
      },
    },
  },
})
