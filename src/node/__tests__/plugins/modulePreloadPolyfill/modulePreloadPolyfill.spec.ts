import { describe, it } from 'vitest'
import type { ModuleFormat, RollupOutput } from 'rollup'
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
  }) as Promise<RollupOutput>

describe('load', () => {
  it('loads modulepreload polyfill', async ({ expect }) => {
    const { output } = await buildProject()
    expect(output).toHaveLength(1)
    expect(output[0].code).toMatchSnapshot()
  })

  it("doesn't load modulepreload polyfill when format is cjs", async ({
    expect,
  }) => {
    const { output } = await buildProject({ format: 'cjs' })
    expect(output).toHaveLength(1)
    expect(output[0].code).toMatchSnapshot()
  })
})
