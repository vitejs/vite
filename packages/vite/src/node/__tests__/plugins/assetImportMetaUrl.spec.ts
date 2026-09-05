import path from 'node:path'
import { parseAst } from 'rollup/parseAst'
import { describe, expect, test } from 'vitest'
import { PartialEnvironment } from '../../baseEnvironment'
import type { InlineConfig } from '../../config'
import { resolveConfig } from '../../config'
import { assetImportMetaUrlPlugin } from '../../plugins/assetImportMetaUrl'

const fixtureImporter = path.resolve(
  import.meta.dirname,
  'fixtures/asset-import-meta-url/index.js',
)

async function createAssetImportMetaurlPluginTransform(
  inlineConfig: InlineConfig = {},
) {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )
  const instance = assetImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string, importer = 'foo.ts') => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      { environment, parse: parseAst },
      code,
      importer,
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

  // `new URL('foo/bar.js', import.meta.url)` is relative to the importer, so the
  // template literal form has to resolve the same way
  test('relative path without a leading ./', async () => {
    expect(
      await transform(
        'new URL(`foo/${dir}.js`, import.meta.url)',
        fixtureImporter,
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("./foo/*.js", {"eager":true,"import":"default","query":"?url"}))[\`./foo/\${dir}.js\`], import.meta.url)"`,
    )
  })

  test('leave a bare specifier to the resolver', async () => {
    expect(
      await transform(
        'new URL(`some-package/${dir}.js`, import.meta.url)',
        fixtureImporter,
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("some-package/*.js", {"eager":true,"import":"default","query":"?url"}))[\`some-package/\${dir}.js\`], import.meta.url)"`,
    )
  })

  test('leave a subpath imports pattern to the resolver', async () => {
    expect(
      await transform(
        'new URL(`#assets-${dir}.js`, import.meta.url)',
        fixtureImporter,
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("#assets-*.js", {"eager":true,"import":"default","query":"?url"}))[\`#assets-\${dir}.js\`], import.meta.url)"`,
    )
  })

  // a virtual module has no directory for the pattern to be relative to, so the
  // pattern must not be matched against the current working directory instead
  test('leave a virtual module importer alone', async () => {
    expect(
      await transform(
        'new URL(`packages/${dir}.js`, import.meta.url)',
        'virtual:routes',
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("packages/*.js", {"eager":true,"import":"default","query":"?url"}))[\`packages/\${dir}.js\`], import.meta.url)"`,
    )
  })

  // the pattern stays non-relative so that the alias keeps resolving it, which is
  // what happens without a directory of the same name too
  test('leave an aliased specifier to the resolver', async () => {
    const transformWithAlias = await createAssetImportMetaurlPluginTransform({
      resolve: {
        alias: {
          foo: path.resolve(
            import.meta.dirname,
            'fixtures/asset-import-meta-url/aliased',
          ),
        },
      },
    })
    expect(
      await transformWithAlias(
        'new URL(`foo/${dir}.js`, import.meta.url)',
        fixtureImporter,
      ),
    ).toMatchInlineSnapshot(
      `"new URL((import.meta.glob("foo/*.js", {"eager":true,"import":"default","query":"?url"}))[\`foo/\${dir}.js\`], import.meta.url)"`,
    )
  })

  test('ignore starting with a variable', async () => {
    expect(
      await transform('new URL(`${file}.js`, import.meta.url)'),
    ).toMatchInlineSnapshot(`"new URL(\`\${file}.js\`, import.meta.url)"`)
  })
})
