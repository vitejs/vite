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
          if (name.includes('after-preload-dynamic')) {
            return 'after-preload-dynamic'
          }
        },
      },
    },
  },
})
