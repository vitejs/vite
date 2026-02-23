import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { transformWithOxc } from '../../plugins/oxc'

describe('transformWithOxc', () => {
  test('correctly overrides TS configuration and applies automatic transform', async () => {
    const jsxImportSource = 'bar'
    const result = await transformWithOxc(
      'const foo = () => <></>',
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-preserve/baz.jsx',
      ),
      {
        jsx: {
          runtime: 'automatic',
          importSource: jsxImportSource,
        },
      },
    )
    expect(result?.code).toContain(`${jsxImportSource}/jsx-runtime`)
    expect(result?.code).toContain('/* @__PURE__ */')
  })

  test('correctly overrides TS configuration and preserves code', async () => {
    const foo = 'const foo = () => <></>'
    const result = await transformWithOxc(
      foo,
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-react-jsx/baz.jsx',
      ),
      {
        jsx: 'preserve',
      },
    )
    expect(result?.code).toContain(foo)
  })

  test('correctly overrides TS configuration and transforms code', async () => {
    const jsxFactory = 'h',
      jsxFragment = 'bar'
    const result = await transformWithOxc(
      'const foo = () => <></>',
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-complex-options/baz.jsx',
      ),
      {
        jsx: {
          runtime: 'classic',
          pragma: jsxFactory,
          pragmaFrag: jsxFragment,
        },
      },
    )
    expect(result?.code).toContain(
      `/* @__PURE__ */ ${jsxFactory}(${jsxFragment}, null)`,
    )
  })

  describe('useDefineForClassFields', async () => {
    const transformClassCode = async (target: string, tsconfigDir: string) => {
      const result = await transformWithOxc(
        `
          class foo {
            bar = 'bar'
          }
        `,
        path.resolve(import.meta.dirname, tsconfigDir, './bar.ts'),
        { target },
      )
      return result?.code
    }

    const [
      defineForClassFieldsTrueTransformedCode,
      defineForClassFieldsTrueLowerTransformedCode,
      defineForClassFieldsFalseTransformedCode,
    ] = await Promise.all([
      transformClassCode('esnext', './fixtures/oxc-tsconfigs/use-define-true'),
      transformClassCode('es2021', './fixtures/oxc-tsconfigs/use-define-true'),
      transformClassCode('esnext', './fixtures/oxc-tsconfigs/use-define-false'),
    ])

    test('target: esnext and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode(
        'esnext',
        './fixtures/oxc-tsconfigs/target-esnext',
      )
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2021 and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode(
        'es2021',
        './fixtures/oxc-tsconfigs/target-esnext',
      )
      expect(actual).toBe(defineForClassFieldsTrueLowerTransformedCode)
    })

    test('target: es2021 and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode(
        'es2021',
        './fixtures/oxc-tsconfigs/target-es2021',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: esnext and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode(
        'esnext',
        './fixtures/oxc-tsconfigs/target-es2021',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: es2022 and tsconfig.target: es2022 => true', async () => {
      const actual = await transformClassCode(
        'es2022',
        './fixtures/oxc-tsconfigs/target-es2022',
      )
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2022 and tsconfig.target: undefined => false', async () => {
      const actual = await transformClassCode(
        'es2022',
        './fixtures/oxc-tsconfigs/empty',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })
  })

  test('supports emitDecoratorMetadata: true', async () => {
    const result = await transformWithOxc(
      `
          function LogMethod(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            console.log(target, propertyKey, descriptor);
          }

          class Demo {
            @LogMethod
            public foo(bar: number) {}
          }

          const demo = new Demo();
        `,
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/decorator-metadata/bar.ts',
      ),
    )
    expect(result?.code).toContain('_decorateMetadata("design:type"')
  })
})
