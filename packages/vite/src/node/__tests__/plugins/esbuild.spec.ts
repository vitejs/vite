import { describe, expect, test } from 'vitest'
import type { ResolvedConfig, UserConfig } from '../../config'
import {
  ESBuildTransformResult,
  resolveEsbuildTranspileOptions,
  transformWithEsbuild,
} from '../../plugins/esbuild'

describe('resolveEsbuildTranspileOptions', () => {
  test('resolve default', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'es2020',
          minify: 'esbuild',
        },
        esbuild: {
          keepNames: true,
        },
      }),
      'es',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: 'es2020',
      format: 'esm',
      keepNames: true,
      minify: true,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve esnext no minify', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'esnext',
          minify: false,
        },
        esbuild: {
          keepNames: true,
        },
      }),
      'es',
    )
    expect(options).toEqual(null)
  })

  test('resolve specific minify options', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
        },
        esbuild: {
          keepNames: true,
          minifyIdentifiers: false,
        },
      }),
      'es',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: undefined,
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve no minify', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          target: 'es2020',
          minify: false,
        },
        esbuild: {
          keepNames: true,
        },
      }),
      'es',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: 'es2020',
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: false,
      minifySyntax: false,
      minifyWhitespace: false,
      treeShaking: false,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve es lib', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js',
          },
        },
        esbuild: {
          keepNames: true,
        },
      }),
      'es',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: undefined,
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: false,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve cjs lib', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js',
          },
        },
        esbuild: {
          keepNames: true,
        },
      }),
      'cjs',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: undefined,
      format: 'cjs',
      keepNames: true,
      minify: true,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve es lib with specific minify options', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js',
          },
        },
        esbuild: {
          keepNames: true,
          minifyIdentifiers: true,
          minifyWhitespace: true,
        },
      }),
      'es',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: undefined,
      format: 'esm',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: false,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })

  test('resolve cjs lib with specific minify options', () => {
    const options = resolveEsbuildTranspileOptions(
      defineResolvedConfig({
        build: {
          minify: 'esbuild',
          lib: {
            entry: './somewhere.js',
          },
        },
        esbuild: {
          keepNames: true,
          minifyIdentifiers: true,
          minifySyntax: false,
          treeShaking: true,
        },
      }),
      'cjs',
    )
    expect(options).toEqual({
      charset: 'utf8',
      target: undefined,
      format: 'cjs',
      keepNames: true,
      minify: false,
      minifyIdentifiers: true,
      minifySyntax: false,
      minifyWhitespace: true,
      treeShaking: true,
      supported: {
        'dynamic-import': true,
        'import-meta': true,
      },
    })
  })
})

describe('transformWithEsbuild', () => {
  test('not throw on inline sourcemap', async () => {
    const result = await transformWithEsbuild(`const foo = 'bar'`, '', {
      sourcemap: 'inline',
    })
    expect(result?.code).toBeTruthy()
    expect(result?.map).toBeTruthy()
  })
})

/**
 * Helper for `resolveEsbuildTranspileOptions` to created resolved config with types.
 * Note: The function only uses `build.target`, `build.minify` and `esbuild` options.
 */
function defineResolvedConfig(config: UserConfig): ResolvedConfig {
  return config as any
}
