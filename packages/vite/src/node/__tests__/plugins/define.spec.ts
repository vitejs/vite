import { describe, expect, test } from 'vitest'
import { definePlugin } from '../../plugins/define'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'

async function createDefinePluginTransform(
  define: Record<string, any> = {},
  build = true,
  ssr = false,
) {
  const config = await resolveConfig(
    { configFile: false, define },
    build ? 'build' : 'serve',
  )
  const instance = definePlugin(config)
  const environment = new PartialEnvironment(ssr ? 'ssr' : 'client', config)

  return async (code: string) => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      { environment },
      code,
      'foo.ts',
    )
    return result?.code || result
  }
}

describe('definePlugin', () => {
  test('replaces custom define', async () => {
    const transform = await createDefinePluginTransform({
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
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('export const version = "1.0";')).toBe(undefined)
    expect(
      await transform('export const version = import.meta.SOMETHING'),
    ).toBe(undefined)
  })

  test('replaces import.meta.env.SSR with false', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const isSSR = import.meta.env.SSR;')).toBe(
      'export const isSSR = false;\n',
    )
  })

  test('preserve import.meta.hot with override', async () => {
    // assert that the default behavior is to replace import.meta.hot with undefined
    const transform = await createDefinePluginTransform()
    expect(await transform('export const hot = import.meta.hot;')).toBe(
      'export const hot = void 0;\n',
    )
    // assert that we can specify a user define to preserve import.meta.hot
    const overrideTransform = await createDefinePluginTransform({
      'import.meta.hot': 'import.meta.hot',
    })
    expect(await overrideTransform('export const hot = import.meta.hot;')).toBe(
      'export const hot = import.meta.hot;\n',
    )
  })

  test('replace import.meta.env.UNKNOWN with undefined', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const foo = import.meta.env.UNKNOWN;')).toBe(
      'export const foo = undefined                       ;\n',
    )
  })

  test('leave import.meta.env["UNKNOWN"] to runtime', async () => {
    const transform = await createDefinePluginTransform()
    expect(
      await transform('export const foo = import.meta.env["UNKNOWN"];'),
    ).toMatch(
      /const __vite_import_meta_env__ = .*;\nexport const foo = __vite_import_meta_env__\["UNKNOWN"\];/,
    )
  })

  test('preserve import.meta.env.UNKNOWN with override', async () => {
    const transform = await createDefinePluginTransform({
      'import.meta.env.UNKNOWN': 'import.meta.env.UNKNOWN',
    })
    expect(await transform('export const foo = import.meta.env.UNKNOWN;')).toBe(
      'export const foo = import.meta.env.UNKNOWN;\n',
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
    ).toMatchInlineSnapshot(`
      "export const isLegacy = __VITE_IS_LEGACY__;
      undefined                          && console.log(undefined                         );
      "
    `)
  })

  test('replace bare import.meta.env', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('export const env = import.meta.env;')).toMatch(
      /const __vite_import_meta_env__ = .*;\nexport const env = __vite_import_meta_env__;/,
    )
  })

  test('already has marker', async () => {
    const transform = await createDefinePluginTransform()
    expect(
      await transform(
        'console.log(__vite_import_meta_env__);\nexport const env = import.meta.env;',
      ),
    ).toMatch(
      /const __vite_import_meta_env__1 = .*;\nconsole.log\(__vite_import_meta_env__\);\nexport const env = __vite_import_meta_env__1;/,
    )

    expect(
      await transform(
        'console.log(__vite_import_meta_env__, __vite_import_meta_env__1);\n export const env = import.meta.env;',
      ),
    ).toMatch(
      /const __vite_import_meta_env__2 = .*;\nconsole.log\(__vite_import_meta_env__, __vite_import_meta_env__1\);\nexport const env = __vite_import_meta_env__2;/,
    )

    expect(
      await transform(
        'console.log(__vite_import_meta_env__);\nexport const env = import.meta.env;\nconsole.log(import.meta.env.UNDEFINED);',
      ),
    ).toMatch(
      /const __vite_import_meta_env__1 = .*;\nconsole.log\(__vite_import_meta_env__\);\nexport const env = __vite_import_meta_env__1;\nconsole.log\(undefined {26}\);/,
    )
  })
})
