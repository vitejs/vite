import { fileURLToPath } from 'node:url'
import babel from '@babel/core'
import MagicString from 'magic-string'
import { Visitor, parseSync } from 'oxc-parser'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
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
    include: [
      '@vitejs/test-dep-class-field-sourcemap-babel',
      '@vitejs/test-dep-class-field-sourcemap-oxc',
    ],
    rolldownOptions: {
      transform: {
        target: 'es2015',
      },
    },
  },
})
