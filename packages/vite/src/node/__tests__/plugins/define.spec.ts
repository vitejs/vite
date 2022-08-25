import { describe, expect, test } from 'vitest'
import { definePlugin } from '../../plugins/define'
import { resolveConfig } from '../../config'

async function createDefinePluginTransform(
  define: Record<string, any> = {},
  build = true,
  ssr = false
) {
  const config = await resolveConfig({ define }, build ? 'build' : 'serve')
  const instance = definePlugin(config)
  return async (code: string) => {
    const transform =
      instance.transform && 'handler' in instance.transform
        ? instance.transform.handler
        : instance.transform
    const result = await transform?.call({}, code, 'foo.ts', { ssr })
    return result?.code || result
  }
}

// FIXME: Use string concatenation to workaround Vite define-replacement of import\.meta.env in string literals
const importMetaEnv = 'import' + '.meta.env'

describe('definePlugin', () => {
  test('replaces custom define', async () => {
    const transform = await createDefinePluginTransform({
      __APP_VERSION__: JSON.stringify('1.0')
    })
    expect(await transform('const version = __APP_VERSION__ ;')).toBe(
      'const version = "1.0" ;'
    )
    expect(await transform('const version = __APP_VERSION__;')).toBe(
      'const version = "1.0";'
    )
  })

  test(`replaces ${importMetaEnv}.SSR with false`, async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform(`const isSSR = ${importMetaEnv}.SSR ;`)).toBe(
      'const isSSR = false ;'
    )
    expect(await transform(`const isSSR = ${importMetaEnv}.SSR;`)).toBe(
      'const isSSR = false;'
    )
  })

  // Specially defined constants found in packages/vite/src/node/plugins/define.ts
  const specialDefines = {
    'process.env.': '({}).',
    'global.process.env.': '({}).',
    'globalThis.process.env.': '({}).',
    'process.env.NODE_ENV': '"test"',
    'global.process.env.NODE_ENV': '"test"',
    'globalThis.process.env.NODE_ENV': '"test"',
    __vite_process_env_NODE_ENV: '"test"',
    [importMetaEnv + '.']: '({}).',
    [importMetaEnv]:
      '{"BASE_URL":"/","MODE":"development","DEV":true,"PROD":false}',
    'import.meta.hot': 'false'
  }
  const specialDefineKeys = Object.keys(specialDefines)

  const specialDefinesSSR = {
    ...specialDefines,
    // process.env is not replaced in SSR
    'process.env.': null,
    'global.process.env.': null,
    'globalThis.process.env.': null,
    'process.env.NODE_ENV': null,
    'global.process.env.NODE_ENV': null,
    'globalThis.process.env.NODE_ENV': null,
    // __vite_process_env_NODE_ENV is a special variable that resolves to process.env.NODE_ENV, which is not replaced in SSR
    __vite_process_env_NODE_ENV: 'process.env.NODE_ENV'
  }

  describe('ignores defined constants in string literals', async () => {
    const singleQuotedDefines = specialDefineKeys
      .map((define) => `let x = '${define}'`)
      .join(';\n')
    const doubleQuotedDefines = specialDefineKeys
      .map((define) => `let x = "${define}"`)
      .join(';\n')
    const backtickedDefines = specialDefineKeys
      .map((define) => `let x = \`${define}\``)
      .join(';\n')
    const singleQuotedDefinesMultilineNested = specialDefineKeys
      .map((define) => `let x = \n'${define}'\n\``)
      .join(';\n')
    const doubleQuotedDefinesMultilineNested = specialDefineKeys
      .map((define) => `let x = \n"${define}"\n\``)
      .join(';\n')
    const backtickedDefinesMultilineNested = specialDefineKeys
      .map((define) => `let x = \`\n${define}\n\``)
      .join(';\n')

    const inputs = [
      ['double-quoted', doubleQuotedDefines],
      ['single-quoted', singleQuotedDefines],
      ['backticked', backtickedDefines],
      ['multiline nested double-quoted', doubleQuotedDefinesMultilineNested],
      ['multiline nested single-quoted', singleQuotedDefinesMultilineNested],
      ['multiline nested backticked', backtickedDefinesMultilineNested]
    ]

    describe('non-SSR', async () => {
      const transform = await createDefinePluginTransform()
      test.each(inputs)('%s', async (label, input) => {
        // transform() returns null when no replacement is made
        expect(await transform(input)).toBe(null)
      })
    })

    describe('SSR', async () => {
      const ssrTransform = await createDefinePluginTransform({}, true, true)
      test.each(inputs)('%s', async (label, input) => {
        // transform() returns null when no replacement is made
        expect(await ssrTransform(input)).toBe(null)
      })
    })
  })

  describe('replaces defined constants in template literal expressions', async () => {
    describe('non-SSR', async () => {
      const transform = await createDefinePluginTransform()

      test.each(specialDefineKeys)('%s', async (key) => {
        const result = await transform('let x = `${' + key + '}`')
        expect(result).toBe('let x = `${' + specialDefines[key] + '}`')
      })

      // multiline tests
      test.each(specialDefineKeys)('%s', async (key) => {
        const result = await transform('let x = `\n${' + key + '}\n`')
        expect(result).toBe('let x = `\n${' + specialDefines[key] + '}\n`')
      })
    })
    describe('SSR', async () => {
      const ssrTransform = await createDefinePluginTransform({}, true, true)

      test.each(specialDefineKeys)('%s', async (key) => {
        const result = await ssrTransform('let x = `${' + key + '}`')
        expect(result).toBe(
          specialDefinesSSR[key]
            ? 'let x = `${' + specialDefinesSSR[key] + '}`'
            : null
        )
      })

      // multiline tests
      test.each(specialDefineKeys)('%s', async (key) => {
        const result = await ssrTransform('let x = `\n${' + key + '}\n`')
        expect(result).toBe(
          specialDefinesSSR[key]
            ? 'let x = `\n${' + specialDefinesSSR[key] + '}\n`'
            : null
        )
      })
    })
  })
})
