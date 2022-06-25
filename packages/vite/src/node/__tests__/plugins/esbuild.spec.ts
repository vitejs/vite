import { describe, expect, test } from 'vitest'
import type { ResolvedConfig, UserConfig } from '../../config'
import { resolveEsbuildTranspileOptions } from '../../plugins/esbuild'

describe('resolveEsbuildTranspileOptions', () => {
  test('resolve default', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'es2020',
          minify: 'esbuild'
        },
        esbuild: {
          keepNames: true
        }
      }),
      'es'
    )
    expect(options).toEqual({
      target: 'es2020',
      format: 'esm',
      keepNames: true,
      minify: true,
      treeShaking: true
    })
  })

  test('resolve esnext no minify', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'esnext',
          minify: false
        },
        esbuild: {
          keepNames: true
        }
      }),
      'es'
    )
    expect(options).toEqual(null)
  })

  test('resolve no minify', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'es2020',
          minify: false
        },
        esbuild: {
          keepNames: true
        }
      }),
      'es'
    )
    expect(options).toEqual({
      target: 'es2020',
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: false,
      minifySyntax: false,
      minifyWhitespace: false,
      treeShaking: false
    })
  })

  test('resolve es lib', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js'
          }
        },
        esbuild: {
          keepNames: true
        }
      }),
      'es'
    )
    expect(options).toEqual({
      target: undefined,
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: false,
      treeShaking: true
    })
  })

  test('resolve cjs lib', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js'
          }
        },
        esbuild: {
          keepNames: true
        }
      }),
      'cjs'
    )
    expect(options).toEqual({
      target: undefined,
      format: 'cjs',
      keepNames: true,
      minify: true,
      treeShaking: true
    })
  })

  test('resolve es lib with specific minify options', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js'
          }
        },
        esbuild: {
          keepNames: true,
          minifyIdentifiers: true,
          minifyWhitespace: true
        }
      }),
      'es'
    )
    expect(options).toEqual({
      target: undefined,
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifyWhitespace: false,
      treeShaking: true
    })
  })

  test('resolve cjs lib with specific minify options', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js'
          }
        },
        esbuild: {
          keepNames: true,
          minifyIdentifiers: true,
          minifyWhitespace: true,
          treeShaking: true
        }
      }),
      'cjs'
    )
    expect(options).toEqual({
      target: undefined,
      format: 'cjs',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifyWhitespace: true,
      treeShaking: true
    })
  })
})

/**
 * Helper for `resolveEsbuildTranspileOptions` to created resolved config with types.
 * Note: The function only uses `build.target`, `build.minify` and `esbuild` options.
 */
function defineResolvedConfig(config: UserConfig): ResolvedConfig {
  return config as any
}
