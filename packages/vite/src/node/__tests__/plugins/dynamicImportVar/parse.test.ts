import { describe, expect, it } from 'vitest'
import { transformDynamicImport } from '../../../plugins/dynamicImportVars'
import { resolve } from 'path'

async function run(input: string) {
  const { glob, rawPattern } = await transformDynamicImport(
    input,
    resolve(__dirname),
    resolve(__dirname, 'index.js'),
    (id) => id.replace('@', resolve(__dirname, './mods/'))
  )
  return `__variableDynamicImportRuntimeHelper(${glob.s.toString()}, \`${rawPattern}\`)`
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
})
