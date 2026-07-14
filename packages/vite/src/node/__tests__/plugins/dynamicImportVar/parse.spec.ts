import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transformDynamicImport } from '../../../plugins/dynamicImportVars'
import { normalizePath } from '../../../utils'
import { isWindows } from '../../../../shared/utils'

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

async function runRaw(input: string) {
  return await transformDynamicImport(
    input,
    normalizePath(resolve(dirname, 'index.js')),
    (id) =>
      id
        .replace('@', resolve(dirname, './mods/'))
        .replace('#', resolve(dirname, '../../')),
    dirname,
  )
}

describe('parse negatives', () => {
  // the module path is static, only the query has a runtime variable, so it
  // must not be routed through `import.meta.glob` (otherwise the glob keys
  // wouldn't include the query and the runtime lookup would fail)
  it('variable only in query', async () => {
    expect(await runRaw('`./mods/mod.js?foo=${bar}`')).toBeNull()
  })

  it('multiple variables only in query', async () => {
    expect(await runRaw('`./mods/mod.js?a=${x}&b=${y}`')).toBeNull()
  })

  it('variable in both path and query is still transformed', async () => {
    expect(await runRaw('`./mods/${base}.js?foo=${bar}`')).not.toBeNull()
  })
})
