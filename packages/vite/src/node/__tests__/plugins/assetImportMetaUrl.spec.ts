import path from 'node:path'
import { parseAst } from 'rollup/parseAst'
import { describe, expect, test } from 'vitest'
import { PartialEnvironment } from '../../baseEnvironment'
import { resolveConfig } from '../../config'
import { assetImportMetaUrlPlugin } from '../../plugins/assetImportMetaUrl'

async function createAssetImportMetaurlPluginTransform() {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = assetImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string) => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      { environment, parse: parseAst },
      code,
      'foo.ts',
    )
    return result?.code || result
  }
}

describe('assetImportMetaUrlPlugin', async () => {
  const transform = await createAssetImportMetaurlPluginTransform()

  test('variable between /', async () => {
    expect(
      await transform('new URL(`./foo/${dir}/index.js`, import.meta.url)'),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("./foo/*/index.js", {"eager":true,"import":"default","query":"?url"}))[\`./foo/\${dir}/index.js\`], import.meta.url)"`,
    )
  })

  test('variable before non-/', async () => {
    expect(
      await transform('new URL(`./foo/${dir}.js`, import.meta.url)'),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("./foo/*.js", {"eager":true,"import":"default","query":"?url"}))[\`./foo/\${dir}.js\`], import.meta.url)"`,
    )
  })

  test('two variables', async () => {
    expect(
      await transform('new URL(`./foo/${dir}${file}.js`, import.meta.url)'),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("./foo/*.js", {"eager":true,"import":"default","query":"?url"}))[\`./foo/\${dir}\${file}.js\`], import.meta.url)"`,
    )
  })

  test('two variables between /', async () => {
    expect(
      await transform(
        'new URL(`./foo/${dir}${dir2}/index.js`, import.meta.url)',
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("./foo/*/index.js", {"eager":true,"import":"default","query":"?url"}))[\`./foo/\${dir}\${dir2}/index.js\`], import.meta.url)"`,
    )
  })

  test('ignore starting with a variable', async () => {
    expect(
      await transform('new URL(`${file}.js`, import.meta.url)'),
    ).toMatchInlineSnapshot(`"new URL(\`\${file}.js\`, import.meta.url)"`)
  })
})

describe('assetImportMetaUrlPlugin watch files', async () => {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = assetImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)
  const file = path.posix.join(
    import.meta.dirname.replaceAll('\\', '/'),
    'assetImportMetaUrl.spec.ts',
  )

  const getWatchFiles = async (url: string) => {
    const watchFiles: string[] = []
    // @ts-expect-error transform.handler should exist
    await instance.transform.handler.call(
      {
        environment,
        parse: parseAst,
        addWatchFile: (file: string) => watchFiles.push(file),
      },
      `new URL('${url}', import.meta.url)`,
      path.join(import.meta.dirname, 'entry.js'),
    )
    return watchFiles
  }

  test('watches the referenced file', async () => {
    expect(await getWatchFiles('./assetImportMetaUrl.spec.ts')).toEqual([file])
  })

  test('watches the referenced file when the url has a query or hash', async () => {
    expect(await getWatchFiles('./assetImportMetaUrl.spec.ts?inline')).toEqual([
      file,
    ])
    expect(await getWatchFiles('./assetImportMetaUrl.spec.ts#hash')).toEqual([
      file,
    ])
  })
})
