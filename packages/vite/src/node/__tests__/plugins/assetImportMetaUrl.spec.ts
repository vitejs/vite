import { describe, expect, test } from 'vitest'
import { parseAst } from 'rollup/parseAst'
import { assetImportMetaUrlPlugin } from '../../plugins/assetImportMetaUrl'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'
import { createCodeFilter } from '../../plugins/pluginFilter'

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

  test('filter should match single line new URL(..., import.meta.url)', () => {
    const codeFilter = createCodeFilter(/new\s+URL.+import\.meta\.url/)
    const singleLineCode = 'new URL("./foo.png", import.meta.url)'
    expect(codeFilter(singleLineCode)).toBe(true)
  })

  test('filter should NOT match multiline new URL(..., import.meta.url) without s flag', () => {
    const codeFilter = createCodeFilter(/new\s+URL.+import\.meta\.url/)
    const multilineCode = `new URL(
  './foo.png',
  import.meta.url
)`
    expect(codeFilter(multilineCode)).toBe(false)
  })

  test('filter should match multiline new URL(..., import.meta.url) with s flag', () => {
    const codeFilter = createCodeFilter(/new\s+URL.+import\.meta\.url/s)
    const multilineCode = `new URL(
  './foo.png',
  import.meta.url
)`
    expect(codeFilter(multilineCode)).toBe(true)
  })

  test('multiline new URL(..., import.meta.url) transformation', async () => {
    const multilineCode = `new URL(
  './foo.png',
  import.meta.url
)`
    const result = await transform(multilineCode)

    // After fixing the filter with the 's' flag, this should be transformed
    expect(result).toContain('new URL')
    expect(result).toContain('import.meta.url')
    // Check that it's been transformed (should contain quotes around the path)
    expect(result).toContain('"/foo.png"')
  })
})
