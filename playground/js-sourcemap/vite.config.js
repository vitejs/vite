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
          if (name.endsWith('after-preload-dynamic-no-dep.js')) {
            return 'after-preload-dynamic-no-dep'
          }
          if (name.includes('with-define-object')) {
            return 'with-define-object'
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
  define: {
    __testDefineObject: '{ "hello": "test" }',
  },
})
