import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { build } from 'vite'
import type { RollupOutput } from 'rollup'
import type { TerserOptions } from '../../plugins/terser'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

describe('terser', () => {
  const run = async (terserOptions: TerserOptions) => {
    const result = (await build({
      root: resolve(__dirname, '../packages/build-project'),
      logLevel: 'silent',
      build: {
        write: false,
        minify: 'terser',
        terserOptions,
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
    return result.output[0].code
  }

  test('basic', async () => {
    await run({})
  })

  test('nth', async () => {
    const resultCode = await run({
      mangle: {
        nth_identifier: {
          get: (n) => {
            return 'prefix_' + n.toString()
          },
        },
      },
    })
    expect(resultCode).toContain('prefix_')
  })
})
