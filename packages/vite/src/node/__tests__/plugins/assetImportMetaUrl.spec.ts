import { describe, expect, test } from 'vitest'
import { parseAst } from 'rollup/parseAst'
import { assetImportMetaUrlPlugin } from '../../plugins/assetImportMetaUrl'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'

async function createAssetImportMetaurlPluginTransform() {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = assetImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string) => {
    // @ts-expect-error transform should exist
    const result = await instance.transform.call(
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
