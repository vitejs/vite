import { fileURLToPath } from 'node:url'
import babel from '@babel/core'
import MagicString from 'magic-string'
import { Visitor, parseSync } from 'oxc-parser'
import { defineConfig } from 'vite'
import transformFooWithInlineSourceMap from './foo-with-sourcemap-plugin'
import { transformZooWithSourcemapPlugin } from './zoo-with-sourcemap-plugin'

export default defineConfig({
  plugins: [
    transformFooWithInlineSourceMap(),
    transformZooWithSourcemapPlugin(),
    {
      name: 'test-babel-transformed-optimized-dep',
      async transform(code, id) {
        if (
          !id.includes('/deps/') ||
          !id.includes('@vitejs_test-dep-class-field-sourcemap-babel.js')
        ) {
          return
        }

        return babel.transformAsync(code, {
          filename: id,
          configFile: false,
          babelrc: false,
          ast: false,
          sourceMaps: true,
          plugins: [() => ({ visitor: { Program() {} } })],
        })
      },
    },
    {
      name: 'test-oxc-transformed-optimized-dep',
      transform(code, id) {
        if (
          !id.includes('/deps/') ||
          !id.includes('@vitejs_test-dep-class-field-sourcemap-oxc.js')
        ) {
          return
        }

        const parsed = parseSync(id, code, { range: true })
        const s = new MagicString(code)
        const visitor = new Visitor({
          Identifier(node) {
            s.overwrite(node.start, node.end, `${node.name}$$$`, {
              storeName: true,
            })
          },
        })
        visitor.visit(parsed.program)

        return {
          code: s.toString(),
          map: s.generateMap({
            hires: true,
            source: id,
            includeContent: true,
          }),
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@vitejs/test-dep-class-field-sourcemap-babel': fileURLToPath(
        new URL('./dep-class-field-sourcemap-babel/index.js', import.meta.url),
      ),
      '@vitejs/test-dep-class-field-sourcemap-oxc': fileURLToPath(
        new URL('./dep-class-field-sourcemap-oxc/index.js', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    exclude: ['@vitejs/test-dep-malicious-sourcemap'],
    include: [
      '@vitejs/test-dep-class-field-sourcemap-babel',
      '@vitejs/test-dep-class-field-sourcemap-oxc',
    ],
    // Force class fields to be downleveled so the optimized deps get the
    // constructor parameter rename shape some of these sourcemap tests assert on.
    rolldownOptions: {
      transform: {
        target: 'es2015',
      },
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        // manualChunks(name) {
        //   if (name.endsWith('after-preload-dynamic.js')) {
        //     return 'after-preload-dynamic'
        //   }
        //   if (name.endsWith('after-preload-dynamic-hashbang.js')) {
        //     return 'after-preload-dynamic-hashbang'
        //   }
        //   if (name.endsWith('after-preload-dynamic-no-dep.js')) {
        //     return 'after-preload-dynamic-no-dep'
        //   }
        //   if (name.includes('with-define-object')) {
        //     return 'with-define-object'
        //   }
        // },
        codeSplitting: {
          groups: [
            { name: 'after-preload-dynamic', test: 'after-preload-dynamic.js' },
            {
              name: 'after-preload-dynamic-hashbang',
              test: 'after-preload-dynamic-hashbang.js',
            },
            {
              name: 'after-preload-dynamic-no-dep',
              test: 'after-preload-dynamic-no-dep.js',
            },
            { name: 'with-define-object', test: 'with-define-object' },
          ],
        },
        banner(chunk) {
          if (chunk.name.endsWith('after-preload-dynamic-hashbang')) {
            return '#!/usr/bin/env node'
          }
        },
        sourcemapDebugIds: true,
      },
    },
  },
  define: {
    __testDefineObject: '{ "hello": "test" }',
  },
})
