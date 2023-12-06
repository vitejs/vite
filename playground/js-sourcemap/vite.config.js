import { defineConfig } from 'vite'
import transformFooWithInlineSourceMap from './foo-with-sourcemap-plugin'

export default defineConfig({
  plugins: [transformFooWithInlineSourceMap()],
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
