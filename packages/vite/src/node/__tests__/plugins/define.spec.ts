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
    const result = await instance.transform.call({}, code, 'foo.ts', { ssr })
    return result?.code || result
  }
}

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

  test('replaces import.meta.env.SSR with false', async () => {
    const transform = await createDefinePluginTransform()
    expect(await transform('const isSSR = import.meta.env.SSR ;')).toBe(
      'const isSSR = false ;'
    )
    expect(await transform('const isSSR = import.meta.env.SSR;')).toBe(
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
    // FIXME: Insert \0 to prevent Vite from replacing special constants in string literals
    ['import\0.meta.env.'.replace(/\0/g, '')]: '({}).',
    ['import\0.meta.env'.replace(/\0/g, '')]: '({})',
    'import.meta.hot': 'false'
  }
  const specialDefineKeys = Object.keys(specialDefines)

  const specialDefinesSSR = {
    'process.env.': null,
    'global.process.env.': null,
    'globalThis.process.env.': null,
    'process.env.NODE_ENV': null,
    'global.process.env.NODE_ENV': null,
    'globalThis.process.env.NODE_ENV': null,
    __vite_process_env_NODE_ENV: 'process.env.NODE_ENV',
    // FIXME: Insert \0 to prevent Vite from replacing special constants in string literals
    ['import\0.meta.env.'.replace(/\0/g, '')]: '({}).',
    ['import\0.meta.env'.replace(/\0/g, '')]: '({})',
    'import.meta.hot': 'false'
  }
  const specialDefineKeysSSR = Object.keys(specialDefinesSSR)

  describe('ignores specially defined constants in string literals', async () => {
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
      test.each(inputs)('in %s', async (label, input) => {
        // transform() returns null when no replacement is made
        expect(await transform(input)).toBe(null)
      })
    })
    describe('SSR', async () => {
      const transform = await createDefinePluginTransform({}, true, true)
      test.each(inputs)('in %s', async (label, input) => {
        // transform() returns null when no replacement is made
        expect(await transform(input)).toBe(null)
      })
    })
  })

  // FIXME: Some of these tests are failing. I'm in the middle of figuring out why.
  describe('replaces defined constants in template literal expressions', async () => {
    describe('non-SSR', async () => {
      const transform = await createDefinePluginTransform()
      test.each(specialDefineKeys)('%s', async (key) => {
        expect(await transform('let x = `${' + key + '}`')).toBe(
          'let x = `${' + specialDefines[key] + '}`'
        )
      })
      test.each(specialDefineKeys)('%s', async (key) => {
        expect(await transform('let x = `\n${' + key + '}\n`')).toBe(
          'let x = `\n${' + specialDefines[key] + '}\n`'
        )
      })
    })
    describe('SSR', async () => {
      const transform = await createDefinePluginTransform({}, true, true)
      test.each(specialDefineKeysSSR)('%s', async (key) => {
        if (specialDefinesSSR[key]) {
          expect(await transform('let x = `${' + key + '}`')).toBe(
            'let x = `${' + specialDefinesSSR[key] + '}`'
          )
        } else {
          expect(await transform('let x = `${' + key + '}`')).toBe(null)
        }
      })
      test.each(specialDefineKeysSSR)('%s', async (key) => {
        if (specialDefinesSSR[key]) {
          expect(await transform('let x = `\n${' + key + '}\n`')).toBe(
            'let x = `\n${' + specialDefinesSSR[key] + '}\n`'
          )
        } else {
          expect(await transform('let x = `\n${' + key + '}\n`')).toBe(null)
        }
      })
    })
  })
})
