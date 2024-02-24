import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { transformDynamicImport } from '../../../plugins/dynamicImportVars'
import { normalizePath } from '../../../utils'
import { isWindows } from '../../../../shared/utils'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

async function run(input: string) {
  const { glob, rawPattern } =
    (await transformDynamicImport(
      input,
      normalizePath(resolve(__dirname, 'index.js')),
      (id) => id.replace('@', resolve(__dirname, './mods/')),
      __dirname,
    )) || {}
  return `__variableDynamicImportRuntimeHelper(${glob}, \`${rawPattern}\`)`
}

describe('parse positives', () => {
  it('basic', async () => {
    expect(await run('`./mods/${base}.js`')).toMatchSnapshot()
  })

  it('alias path', async () => {
    expect(await run('`@/${base}.js`')).toMatchSnapshot()
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
