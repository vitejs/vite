import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import type { ResolvedConfig, UserConfig } from '../../config'
import type { ViteDevServer } from '../../server'
import {
  injectEsbuildHelpers,
  registerTsconfigDependency,
  reloadOnTsconfigChange,
  resolveEsbuildTranspileOptions,
  transformWithEsbuild,
} from '../../plugins/esbuild'
import { normalizePath } from '../../utils'

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
        normalizePath(path.resolve(import.meta.dirname, 'bar.ts')),
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
      const actual = await transformClassCode('es2022', {
        target: undefined,
      })
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })
  })
})

describe('injectEsbuildHelpers', () => {
  test('injects helpers in IIFE format', () => {
    const esbuildCode =
      'var $=function(){};var MyLib=(function(){"use strict";return 42;})()'
    const result = injectEsbuildHelpers(esbuildCode, 'iife')
    expect(result).toBe(
      'var MyLib=(function(){"use strict";var $=function(){};return 42;})()',
    )
  })

  test('injects helpers in IIFE format (pre esbuild 0.25.9)', () => {
    const esbuildCode =
      'var $=function(){};var MyLib=function(){"use strict";return 42;}()'
    const result = injectEsbuildHelpers(esbuildCode, 'iife')
    expect(result).toBe(
      'var MyLib=function(){"use strict";var $=function(){};return 42;}()',
    )
  })

  test('injects helpers in UMD format', () => {
    const esbuildCode =
      'var $=function(){};(function(global){"use strict";return 42;})'
    const result = injectEsbuildHelpers(esbuildCode, 'umd')
    expect(result).toBe(
      '(function(global){"use strict";var $=function(){};return 42;})',
    )
  })

  test('handles helpers with special characters', () => {
    const esbuildCode =
      'var $$=function(){};var MyLib=(function(){"use strict";return 42;})()'
    const result = injectEsbuildHelpers(esbuildCode, 'iife')
    expect(result).toContain('"use strict";var $$=function(){};')
  })
})

describe('reloadOnTsconfigChange', () => {
  function createMockConfig(): ResolvedConfig {
    return {
      logger: { info: vi.fn() },
      clearScreen: false,
    } as unknown as ResolvedConfig
  }

  function createMockServer(config: ResolvedConfig) {
    const invalidateAll = vi.fn()
    const invalidateModule = vi.fn()
    const getModulesByFile = vi.fn().mockReturnValue(undefined)
    const hotSend = vi.fn()

    const server = {
      config,
      environments: {
        client: {
          moduleGraph: { invalidateAll, invalidateModule, getModulesByFile },
          hot: { send: hotSend },
        },
      },
    } as unknown as ViteDevServer

    return {
      server,
      invalidateAll,
      invalidateModule,
      getModulesByFile,
      hotSend,
    }
  }

  test('create event: invalidates all modules', () => {
    const config = createMockConfig()
    const { server, invalidateAll, invalidateModule } = createMockServer(config)

    reloadOnTsconfigChange(server, '/project/src/tsconfig.json', 'create')

    expect(invalidateAll).toHaveBeenCalledOnce()
    expect(invalidateModule).not.toHaveBeenCalled()
  })

  test('delete event: invalidates all modules', () => {
    const config = createMockConfig()
    const { server, invalidateAll, invalidateModule } = createMockServer(config)

    reloadOnTsconfigChange(server, '/project/src/tsconfig.json', 'delete')

    expect(invalidateAll).toHaveBeenCalledOnce()
    expect(invalidateModule).not.toHaveBeenCalled()
  })

  test('update event with no registered dependents: invalidates all modules', () => {
    const config = createMockConfig()
    const { server, invalidateAll, invalidateModule } = createMockServer(config)

    reloadOnTsconfigChange(server, '/project/src/tsconfig.json', 'update')

    expect(invalidateAll).toHaveBeenCalledOnce()
    expect(invalidateModule).not.toHaveBeenCalled()
  })

  test('update event with registered dependents: invalidates only affected modules', () => {
    const config = createMockConfig()
    const { server, invalidateAll, invalidateModule, getModulesByFile } =
      createMockServer(config)

    const tsconfigFile = '/project/src/tsconfig.json'
    const sourceFile = '/project/src/foo.ts'
    const mockMod = { id: sourceFile }

    registerTsconfigDependency(config, tsconfigFile, sourceFile)
    getModulesByFile.mockReturnValue(new Set([mockMod]))

    reloadOnTsconfigChange(server, tsconfigFile, 'update')

    expect(invalidateAll).not.toHaveBeenCalled()
    expect(getModulesByFile).toHaveBeenCalledWith(sourceFile)
    expect(invalidateModule).toHaveBeenCalledWith(mockMod, expect.any(Set))
  })

  test('full-reload is always sent regardless of event type', () => {
    const config = createMockConfig()
    const { server, hotSend } = createMockServer(config)

    reloadOnTsconfigChange(server, '/project/src/tsconfig.json', 'update')

    expect(hotSend).toHaveBeenCalledWith({ type: 'full-reload', path: '*' })
  })

  test('non-tsconfig json file: no invalidation or reload', () => {
    const config = createMockConfig()
    const { server, invalidateAll, hotSend } = createMockServer(config)

    reloadOnTsconfigChange(server, '/project/src/package.json', 'update')

    expect(invalidateAll).not.toHaveBeenCalled()
    expect(hotSend).not.toHaveBeenCalled()
  })
})

/**
 * Helper for `resolveEsbuildTranspileOptions` to created resolved config with types.
 * Note: The function only uses `build.target`, `build.minify` and `esbuild` options.
 */
function defineResolvedConfig(config: UserConfig): ResolvedConfig {
  return config as any
}
