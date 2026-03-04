import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { transformGlobImport } from '../../../plugins/importMetaGlob'
import { transformWithEsbuild } from '../../../plugins/esbuild'

describe('fixture', async () => {
  const resolveId = (id: string) => id
  const root = import.meta.dirname

  it('transform', async () => {
    const id = resolve(import.meta.dirname, './fixture-a/index.ts')
    const code = (
      await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)
    ).code

    expect(
      (await transformGlobImport(code, id, root, resolveId))?.s.toString(),
    ).toMatchSnapshot()
  })

  it('preserve line count', async () => {
    const getTransformedLineCount = async (code: string) =>
      (await transformGlobImport(code, 'virtual:module', root, resolveId))?.s
        .toString()
        .split('\n').length

    expect(await getTransformedLineCount("import.meta.glob('./*.js')")).toBe(1)
    expect(
      await getTransformedLineCount(
        `
          import.meta.glob(
            './*.js'
          )
        `.trim(),
      ),
    ).toBe(3)
  })

  it('virtual modules', async () => {
    const root = resolve(import.meta.dirname, './fixture-a')
    const code = [
      "import.meta.glob('/modules/*.ts')",
      "import.meta.glob(['/../fixture-b/*.ts'])",
      "import.meta.glob(['./*.ts'], { base: '/modules' })",
    ].join('\n')
    expect(
      (
        await transformGlobImport(code, 'virtual:module', root, resolveId)
      )?.s.toString(),
    ).toMatchSnapshot()

    try {
      await transformGlobImport(
        "import.meta.glob('./modules/*.ts')",
        'virtual:module',
        root,
        resolveId,
      )
      expect('no error').toBe('should throw an error')
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        "[Error: In virtual modules, all globs must start with '/']",
      )
    }
  })

  it('transform with restoreQueryExtension', async () => {
    const id = resolve(import.meta.dirname, './fixture-a/index.ts')
    const code = (
      await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)
    ).code

    expect(
      (
        await transformGlobImport(code, id, root, resolveId, true)
      )?.s.toString(),
    ).toMatchSnapshot()
  })
})

describe('caseInsensitive option', async () => {
  const resolveId = (id: string) => id
  const fixtureDir = resolve(import.meta.dirname, './fixture-c')
  const fixtureId = resolve(fixtureDir, 'index.ts')

  const transform = (code: string) =>
    transformGlobImport(code, fixtureId, fixtureDir, resolveId)

  const keys = async (code: string) => {
    const result = await transform(code)
    // Extract object keys from the generated code
    return [...(result?.s.toString().matchAll(/"(\.\/[^"]+)":\s/g) ?? [])].map(
      (m) => m[1],
    )
  }

  it('default behavior is case-sensitive: *.png does not match logo.PNG', async () => {
    const matched = await keys(`import.meta.glob('./assets/*.png')`)
    // On Linux (case-sensitive FS) logo.PNG won't be matched; icon.png will.
    // On Windows/macOS the FS is case-insensitive so both match either way.
    // We only assert that icon.png is always present (it matches exactly).
    expect(matched).toContain('./assets/icon.png')
  })

  it('caseInsensitive: true matches both .png and .PNG', async () => {
    const matched = await keys(
      `import.meta.glob('./assets/*.png', { caseInsensitive: true })`,
    )
    expect(matched).toContain('./assets/icon.png')
    expect(matched).toContain('./assets/logo.PNG')
  })

  it('caseInsensitive works with brace patterns {png,jpg}', async () => {
    const matched = await keys(
      `import.meta.glob('./assets/*.{png,jpg}', { caseInsensitive: true })`,
    )
    expect(matched).toContain('./assets/icon.png')
    expect(matched).toContain('./assets/logo.PNG')
    expect(matched).toContain('./assets/photo.jpg')
    expect(matched).toContain('./assets/banner.JPEG')
  })

  it('caseInsensitive does not match files outside the pattern', async () => {
    const matched = await keys(
      `import.meta.glob('./assets/*.png', { caseInsensitive: true })`,
    )
    // .jpg / .JPEG should not be included when only *.png is requested
    expect(matched).not.toContain('./assets/photo.jpg')
    expect(matched).not.toContain('./assets/banner.JPEG')
  })

  it('result paths use forward slashes regardless of OS', async () => {
    const result = await transform(
      `import.meta.glob('./assets/*.png', { caseInsensitive: true })`,
    )
    expect(result?.s.toString()).not.toMatch(/\\/)
  })
})
