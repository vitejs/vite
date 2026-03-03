import { describe, expect, test } from 'vitest'
import { rolldown } from 'rolldown'
import { definePlugin } from '../../plugins/define'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'

async function createDefinePluginTransform(
  define: Record<string, any> = {},
  isSsrDev = false,
) {
  const ssr = isSsrDev
  const build = !isSsrDev
  const config = await resolveConfig(
    { configFile: false, define, environments: { ssr: {} } },
    build ? 'build' : 'serve',
  )
  const instance = definePlugin(config)
  const environment = new PartialEnvironment(ssr ? 'ssr' : 'client', config)

  return async (code: string) => {
    if (isSsrDev) {
      // @ts-expect-error transform.handler should exist
      const result = await instance.transform.handler.call(
        { environment },
        code,
        'foo.ts',
      )
      return result?.code || result
    } else {
      const bundler = await rolldown({
        input: 'entry.js',
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
                return code
              }
            },
          },
          {
            name: 'native:define',
            options: (definePlugin(config).options! as any).bind({
              environment,
            }),
          },
        ],
        experimental: {
          attachDebugInfo: 'none',
        },
      })
      return (await bundler.generate()).output[0].code
    }
  }
}

describe('definePlugin (SSR dev)', () => {
  const createJsDefinePluginTransform = (define: Record<string, any> = {}) =>
    createDefinePluginTransform(define, true)

  test('replaces custom define', async () => {
    const transform = await createJsDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('export const version = __APP_VERSION__ ;')).toBe(
      'export const version = "1.0";\n',
    )
    expect(await transform('export const version = __APP_VERSION__;')).toBe(
      'export const version = "1.0";\n',
    )
  })

  test('should not replace if not defined', async () => {
    const transform = await createJsDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('export const version = "1.0";')).toBe(undefined)
    expect(
      await transform('export const version = import.meta.SOMETHING'),
    ).toBe(undefined)
  })

  test('replace import.meta.env when it is a invalid json', async () => {
    const transform = await createJsDefinePluginTransform({
      'import.meta.env.LEGACY': '__VITE_IS_LEGACY__',
    })

    expect(
      await transform(
        'export const isLegacy = import.meta.env.LEGACY;\nimport.meta.env.UNDEFINED && console.log(import.meta.env.UNDEFINED);',
      ),
    ).toMatchInlineSnapshot(`
      "export const isLegacy = __VITE_IS_LEGACY__;
      import.meta.env.UNDEFINED && console.log(import.meta.env.UNDEFINED);
      "
    `)
  })
})

describe('native definePlugin', () => {
  test('replaces custom define', async () => {
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('export const version = __APP_VERSION__;')).toBe(
      'const version = "1.0";\n\nexport { version };',
    )
    expect(await transform('export const version = __APP_VERSION__ ;')).toBe(
      'const version = "1.0";\n\nexport { version };',
    )
  })

  test('should not replace if not defined', async () => {
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('export const version = "1.0";')).toBe(
      'const version = "1.0";\n\nexport { version };',
    )
    expect(
      await transform('export const version = import.meta.SOMETHING'),
    ).toBe('const version = import.meta.SOMETHING;\n\nexport { version };')
  })

  test('replaces import.meta.env.SSR with false', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const isSSR = import.meta.env.SSR;')).toBe(
      'const isSSR = false;\n\nexport { isSSR };',
    )
  })

  test('preserve import.meta.hot with override', async () => {
    // assert that the default behavior is to replace import.meta.hot with undefined
    const transform = await createDefinePluginTransform()
    expect(await transform('export const hot = import.meta.hot;')).toBe(
      'const hot = void 0;\n\nexport { hot };',
    )
    // assert that we can specify a user define to preserve import.meta.hot
    const overrideTransform = await createDefinePluginTransform({
      'import.meta.hot': 'import.meta.hot',
    })
    expect(await overrideTransform('export const hot = import.meta.hot;')).toBe(
      'const hot = import.meta.hot;\n\nexport { hot };',
    )
  })

  test('replace import.meta.env.UNKNOWN with undefined', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const foo = import.meta.env.UNKNOWN;')).toBe(
      'const foo = void 0;\n\nexport { foo };',
    )
  })

  test('leave import.meta.env["UNKNOWN"] to runtime', async () => {
    const transform = await createDefinePluginTransform()
    expect(
      await transform('export const foo = import.meta.env["UNKNOWN"];'),
    ).toMatch(/const foo = .*\["UNKNOWN"\];\n\nexport \{ foo \};/s)
  })

  test('preserve import.meta.env.UNKNOWN with override', async () => {
    const transform = await createDefinePluginTransform({
      'import.meta.env.UNKNOWN': 'import.meta.env.UNKNOWN',
    })
    expect(await transform('export const foo = import.meta.env.UNKNOWN;')).toBe(
      'const foo = import.meta.env.UNKNOWN;\n\nexport { foo };',
    )
  })

  test('replace import.meta.env when it is a invalid json', async () => {
    const transform = await createDefinePluginTransform({
      'import.meta.env.LEGACY': '__VITE_IS_LEGACY__',
    })

    expect(
      await transform(
        'export const isLegacy = import.meta.env.LEGACY;\nimport.meta.env.UNDEFINED && console.log(import.meta.env.UNDEFINED);',
      ),
    ).toMatchInlineSnapshot(
      `"const isLegacy = __VITE_IS_LEGACY__;\n\nexport { isLegacy };"`,
    )
  })

  test('replace bare import.meta.env', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const env = import.meta.env;')).toMatch(
      /const env = .*;\n\nexport \{ env \};/s,
    )
  })
})
