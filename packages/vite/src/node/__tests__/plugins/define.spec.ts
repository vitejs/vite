import { describe, expect, test } from 'vitest'
import { definePlugin } from '../../plugins/define'
import { resolveConfig } from '../../config'

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
  return async (code: string) => {
    // @ts-expect-error transform should exist
    const result = await instance.transform.call({}, code, 'foo.ts', { ssr })
    return result?.code || result
  }
}

describe('definePlugin', () => {
  test('replaces custom define', async () => {
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('const version = __APP_VERSION__ ;')).toBe(
      'const version = "1.0";\n',
    )
    expect(await transform('const version = __APP_VERSION__;')).toBe(
      'const version = "1.0";\n',
    )
  })

  test('should not replace if not defined', async () => {
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0'),
    })
    expect(await transform('const version = "1.0";')).toBe(undefined)
    expect(await transform('const version = import.meta.SOMETHING')).toBe(
      undefined,
    )
  })

  test('replaces import.meta.env.SSR with false', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('const isSSR = import.meta.env.SSR;')).toBe(
      'const isSSR = false;\n',
    )
  })

  test('preserve import.meta.hot with override', async () => {
    // assert that the default behavior is to replace import.meta.hot with undefined
    const transform = await createDefinePluginTransform()
    expect(await transform('const hot = import.meta.hot;')).toBe(
      'const hot = void 0;\n',
    )
    // assert that we can specify a user define to preserve import.meta.hot
    const overrideTransform = await createDefinePluginTransform({
      'import.meta.hot': 'import.meta.hot',
    })
    expect(await overrideTransform('const hot = import.meta.hot;')).toBe(
      'const hot = import.meta.hot;\n',
    )
  })

  test('replace import.meta.env.UNKNOWN with undefined', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('const foo = import.meta.env.UNKNOWN;')).toBe(
      'const foo = undefined                       ;\n',
    )
  })

  test('leave import.meta.env["UNKNOWN"] to runtime', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('const foo = import.meta.env["UNKNOWN"];')).toMatch(
      /const __vite_import_meta_env__ = .*;\nconst foo = __vite_import_meta_env__\["UNKNOWN"\];/,
    )
  })

  test('preserve import.meta.env.UNKNOWN with override', async () => {
    const transform = await createDefinePluginTransform({
      'import.meta.env.UNKNOWN': 'import.meta.env.UNKNOWN',
    })
    expect(await transform('const foo = import.meta.env.UNKNOWN;')).toBe(
      'const foo = import.meta.env.UNKNOWN;\n',
    )
  })

  test('replace import.meta.env when it is a invalid json', async () => {
    const transform = await createDefinePluginTransform({
      'import.meta.env.LEGACY': '__VITE_IS_LEGACY__',
    })

    expect(
      await transform(
        'const isLegacy = import.meta.env.LEGACY;\nimport.meta.env.UNDEFINED && console.log(import.meta.env.UNDEFINED);',
      ),
    ).toMatchInlineSnapshot(`
      "const isLegacy = __VITE_IS_LEGACY__;
      undefined                          && console.log(undefined                         );
      "
    `)
  })

  test('replace bare import.meta.env', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('const env = import.meta.env;')).toMatch(
      /const __vite_import_meta_env__ = .*;\nconst env = __vite_import_meta_env__;/,
    )
  })

  test('already has marker', async () => {
    const transform = await createDefinePluginTransform()
    expect(
      await transform(
        'console.log(__vite_import_meta_env__);\nconst env = import.meta.env;',
      ),
    ).toMatch(
      /const __vite_import_meta_env__1 = .*;\nconsole.log\(__vite_import_meta_env__\);\nconst env = __vite_import_meta_env__1;/,
    )

    expect(
      await transform(
        'console.log(__vite_import_meta_env__, __vite_import_meta_env__1);\n const env = import.meta.env;',
      ),
    ).toMatch(
      /const __vite_import_meta_env__2 = .*;\nconsole.log\(__vite_import_meta_env__, __vite_import_meta_env__1\);\nconst env = __vite_import_meta_env__2;/,
    )

    expect(
      await transform(
        'console.log(__vite_import_meta_env__);\nconst env = import.meta.env;\nconsole.log(import.meta.env.UNDEFINED);',
      ),
    ).toMatch(
      /const __vite_import_meta_env__1 = .*;\nconsole.log\(__vite_import_meta_env__\);\nconst env = __vite_import_meta_env__1;\nconsole.log\(undefined {26}\);/,
    )
  })
})
