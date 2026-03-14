import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  dynamicImportVarsPlugin,
  transformDynamicImport,
} from '../../../plugins/dynamicImportVars'
import { normalizePath } from '../../../utils'
import { isWindows } from '../../../../shared/utils'
import { resolveConfig } from '../../../config'
import { PartialEnvironment } from '../../../baseEnvironment'

const dirname = import.meta.dirname

async function run(input: string) {
  const { glob, rawPattern } =
    (await transformDynamicImport(
      input,
      normalizePath(resolve(dirname, 'index.js')),
      (id) =>
        id
          .replace('@', resolve(dirname, './mods/'))
          .replace('#', resolve(dirname, '../../')),
      dirname,
    )) || {}
  return `__variableDynamicImportRuntimeHelper(${glob}, \`${rawPattern}\`)`
}

async function createPluginTransform() {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = dynamicImportVarsPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string) => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      {
        environment,
        warn() {
          return undefined
        },
      },
      code,
      normalizePath(resolve(dirname, 'index.js')),
    )
    return result?.code || result
  }
}

describe('parse positives', () => {
  it('basic', async () => {
    expect(await run('`./mods/${base}.js`')).toMatchSnapshot()
  })

  it('alias path', async () => {
    expect(await run('`@/${base}.js`')).toMatchSnapshot()
  })

  it('alias path with multi ../', async () => {
    expect(await run('`#/${base}.js`')).toMatchSnapshot()
  })

  it('with query', async () => {
    expect(await run('`./mods/${base}.js?foo=bar`')).toMatchSnapshot()
  })

  it('with query raw', async () => {
    expect(await run('`./mods/${base}.js?raw`')).toMatchSnapshot()
  })

  it('with query url', async () => {
    expect(await run('`./mods/${base}.js?url`')).toMatchSnapshot()
  })

  it('? in variables', async () => {
    expect(await run('`./mods/${base ?? foo}.js?raw`')).toMatchSnapshot()
  })

  // ? is not escaped on windows (? cannot be used as a filename on windows)
  it.skipIf(isWindows)('? in url', async () => {
    expect(await run('`./mo?ds/${base ?? foo}.js?url`')).toMatchSnapshot()
  })

  // ? is not escaped on windows (? cannot be used as a filename on windows)
  it.skipIf(isWindows)('? in worker', async () => {
    expect(await run('`./mo?ds/${base ?? foo}.js?worker`')).toMatchSnapshot()
  })

  it('with ../ and itself', async () => {
    expect(await run('`../dynamicImportVar/${name}.js`')).toMatchSnapshot()
  })

  it('with multi ../ and itself', async () => {
    expect(
      await run('`../../plugins/dynamicImportVar/${name}.js`'),
    ).toMatchSnapshot()
  })
})

describe('dynamicImportVarsPlugin', async () => {
  const transform = await createPluginTransform()

  it('transforms template literal imports with leading comments', async () => {
    const result = await transform(
      'const strings = await import(/* strings */ `./mods/${base}.js`)',
    )

    expect(result).toContain('__variableDynamicImportRuntimeHelper')
    expect(result).toContain('import.meta.glob("./mods/*.js")')
  })
})
