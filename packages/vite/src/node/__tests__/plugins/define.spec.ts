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
      undefined,
    )
  })
})
