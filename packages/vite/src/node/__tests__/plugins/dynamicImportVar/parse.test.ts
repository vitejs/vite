import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'
import { transformDynamicImport } from '../../../plugins/dynamicImportVars'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

async function run(input: string) {
  const { glob, rawPattern } =
    (await transformDynamicImport(input, resolve(__dirname, 'index.js'), (id) =>
      id.replace('@', resolve(__dirname, './mods/'))
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

  it('with query raw', async () => {
    expect(await run('`./mods/${base}.js?raw`')).toMatchSnapshot()
  })

  it('with query url', async () => {
    expect(await run('`./mods/${base}.js?url`')).toMatchSnapshot()
  })

  it('? in variables', async () => {
    expect(await run('`./mods/${base ?? foo}.js?raw`')).toMatchSnapshot()
  })

  it('? in url', async () => {
    expect(await run('`./mo?ds/${base ?? foo}.js?raw`')).toMatchSnapshot()
  })
})
