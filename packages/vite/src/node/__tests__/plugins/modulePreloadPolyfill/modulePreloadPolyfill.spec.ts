import { describe, it } from 'vitest'
import type { ModuleFormat, RolldownOutput } from 'rolldown'
import { build } from '../../../build'
import { modulePreloadPolyfillId } from '../../../plugins/modulePreloadPolyfill'

const buildProject = ({ format = 'es' as ModuleFormat } = {}) =>
  build({
    logLevel: 'silent',
    build: {
      write: false,
      rollupOptions: {
        input: 'main.js',
        output: {
          format,
        },
        treeshake: {
          moduleSideEffects: false,
        },
      },
      minify: false,
    },
    plugins: [
      {
        name: 'test',
        resolveId(id) {
          if (id === 'main.js') {
            return `\0${id}`
          }
        },
        load(id) {
          if (id === '\0main.js') {
            return `import '${modulePreloadPolyfillId}'`
          }
        },
      },
    ],
  }) as Promise<RolldownOutput>

describe('load', () => {
  // FIXME: https://github.com/oxc-project/oxc/issues/13176
  it.skipIf(process.env._VITE_TEST_JS_PLUGIN)(
    'loads modulepreload polyfill',
    async ({ expect }) => {
      const { output } = await buildProject()
      expect(output).toHaveLength(1)
      expect(output[0].code).toMatchSnapshot()
    },
  )

  // FIXME: https://github.com/oxc-project/oxc/issues/13176
  it.skipIf(process.env._VITE_TEST_JS_PLUGIN)(
    "doesn't load modulepreload polyfill when format is cjs",
    async ({ expect }) => {
      const { output } = await buildProject({ format: 'cjs' })
      expect(output).toHaveLength(1)
      expect(output[0].code).toMatchSnapshot()
    },
  )
})
