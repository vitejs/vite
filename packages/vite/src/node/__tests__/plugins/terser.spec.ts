import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { build } from 'vite'
import type { RollupOutput } from 'rollup'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

describe('terser', () => {
  test('nth', async () => {
    const result = (await build({
      root: resolve(__dirname, '../packages/build-project'),
      logLevel: 'silent',
      build: {
        write: false,
        minify: 'terser',
        terserOptions: {
          mangle: {
            nth_identifier: {
              get: (n) => {
                return 'prefix_' + n.toString()
              },
            },
          },
        },
      },
      plugins: [
        {
          name: 'test',
          resolveId(id) {
            if (id === 'entry.js') {
              return '\0' + id
            }
          },
          load(id) {
            if (id === '\0entry.js') {
              return `const foo = 1;console.log(foo)`
            }
          },
        },
      ],
    })) as RollupOutput
    expect(result.output[0].code).toContain('prefix_')
  })
})
