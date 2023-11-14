import { describe, expect, test } from 'vitest'
import type { ResolvedConfig, UserConfig } from '../../config'
import {
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
      loader: 'js',
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
      loader: 'js',
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
      loader: 'js',
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
      loader: 'js',
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
      loader: 'js',
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
      loader: 'js',
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
      loader: 'js',
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

  test('correctly overrides TS configuration and applies automatic transform', async () => {
    const jsxImportSource = 'bar'
    const result = await transformWithEsbuild(
      'const foo = () => <></>',
      'baz.jsx',
      {
        tsconfigRaw: {
          compilerOptions: {
            jsx: 'preserve',
          },
        },
        jsx: 'automatic',
        jsxImportSource,
      },
    )
    expect(result?.code).toContain(`${jsxImportSource}/jsx-runtime`)
    expect(result?.code).toContain('/* @__PURE__ */')
  })

  test('correctly overrides TS configuration and preserves code', async () => {
    const foo = 'const foo = () => <></>'
    const result = await transformWithEsbuild(foo, 'baz.jsx', {
      tsconfigRaw: {
        compilerOptions: {
          jsx: 'react-jsx',
        },
      },
      jsx: 'preserve',
    })
    expect(result?.code).toContain(foo)
  })

  test('correctly overrides TS configuration and transforms code', async () => {
    const jsxFactory = 'h',
      jsxFragment = 'bar'
    const result = await transformWithEsbuild(
      'const foo = () => <></>',
      'baz.jsx',
      {
        tsconfigRaw: {
          compilerOptions: {
            jsxFactory: 'g',
            jsxFragmentFactory: 'foo',
            jsxImportSource: 'baz',
          },
        },
        jsx: 'transform',
        jsxFactory,
        jsxFragment,
      },
    )
    expect(result?.code).toContain(
      `/* @__PURE__ */ ${jsxFactory}(${jsxFragment}, null)`,
    )
  })

  describe('useDefineForClassFields', async () => {
    const transformClassCode = async (
      target: string,
      tsconfigCompilerOptions: {
        target?: string
        useDefineForClassFields?: boolean
      },
    ) => {
      const result = await transformWithEsbuild(
        `
          class foo {
            bar = 'bar'
          }
        `,
        'bar.ts',
        {
          target,
          tsconfigRaw: { compilerOptions: tsconfigCompilerOptions },
        },
      )
      return result?.code
    }

    const [
      defineForClassFieldsTrueTransformedCode,
      defineForClassFieldsTrueLowerTransformedCode,
      defineForClassFieldsFalseTransformedCode,
    ] = await Promise.all([
      transformClassCode('esnext', {
        useDefineForClassFields: true,
      }),
      transformClassCode('es2021', {
        useDefineForClassFields: true,
      }),
      transformClassCode('esnext', {
        useDefineForClassFields: false,
      }),
    ])

    test('target: esnext and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode('esnext', {
        target: 'esnext',
      })
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2021 and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode('es2021', {
        target: 'esnext',
      })
      expect(actual).toBe(defineForClassFieldsTrueLowerTransformedCode)
    })

    test('target: es2021 and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode('es2021', {
        target: 'es2021',
      })
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: esnext and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode('esnext', {
        target: 'es2021',
      })
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: es2022 and tsconfig.target: es2022 => true', async () => {
      const actual = await transformClassCode('es2022', {
        target: 'es2022',
      })
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2022 and tsconfig.target: undefined => false', async () => {
      const actual = await transformClassCode('es2022', {})
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
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
