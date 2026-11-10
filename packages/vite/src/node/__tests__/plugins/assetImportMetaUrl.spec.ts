import path from 'node:path'
import { parseAst } from 'rollup/parseAst'
import { describe, expect, test } from 'vitest'
import { PartialEnvironment } from '../../baseEnvironment'
import { resolveConfig } from '../../config'
import { assetImportMetaUrlPlugin } from '../../plugins/assetImportMetaUrl'
import { normalizePath } from '../../utils'

async function createAssetImportMetaurlPluginTransform(
  addWatchFile?: (file: string) => void,
) {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = assetImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string, id = 'foo.ts') => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      { environment, parse: parseAst, addWatchFile },
      code,
      id,
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

describe('assetImportMetaUrlPlugin watch files', () => {
  const file = normalizePath(
    path.join(import.meta.dirname, 'assetImportMetaUrl.spec.ts'),
  )

  const cases = [
    './assetImportMetaUrl.spec.ts',
    './assetImportMetaUrl.spec.ts?inline',
    './assetImportMetaUrl.spec.ts#hash',
  ]

  for (const url of cases) {
    test(`watches the referenced file for ${url}`, async () => {
      const watchFiles: string[] = []
      const transform = await createAssetImportMetaurlPluginTransform((file) =>
        watchFiles.push(file),
      )
      await transform(
        `new URL('${url}', import.meta.url)`,
        path.join(import.meta.dirname, 'entry.js'),
      )
      expect(watchFiles).toStrictEqual([file])
    })
  }
})
