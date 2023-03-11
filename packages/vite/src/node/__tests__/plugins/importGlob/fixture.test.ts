import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { transformGlobImport } from '../../../plugins/importMetaGlob'
import { transformWithEsbuild } from '../../../plugins/esbuild'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

describe('fixture', async () => {
  const resolveId = (id: string) => id
  const root = resolve(__dirname, '..')

  it('transform', async () => {
    const id = resolve(__dirname, './fixture-a/index.ts')
    const code = (
      await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)
    ).code

    expect(
      (
        await transformGlobImport(code, id, root, resolveId, true)
      )?.s.toString(),
    ).toMatchSnapshot()
  })

  it('preserve line count', async () => {
    const getTransformedLineCount = async (code: string) =>
      (
        await transformGlobImport(code, 'virtual:module', root, resolveId, true)
      )?.s
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
    const root = resolve(__dirname, './fixture-a')
    const code = [
      "import.meta.glob('/modules/*.ts')",
      "import.meta.glob(['/../fixture-b/*.ts'])",
    ].join('\n')
    expect(
      (
        await transformGlobImport(code, 'virtual:module', root, resolveId, true)
      )?.s.toString(),
    ).toMatchSnapshot()

    try {
      await transformGlobImport(
        "import.meta.glob('./modules/*.ts')",
        'virtual:module',
        root,
        resolveId,
        true,
      )
      expect('no error').toBe('should throw an error')
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        "[Error: In virtual modules, all globs must start with '/']",
      )
    }
  })

  it('transform with restoreQueryExtension', async () => {
    const id = resolve(__dirname, './fixture-a/index.ts')
    const code = (
      await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)
    ).code

    expect(
      (
        await transformGlobImport(code, id, root, resolveId, true, true)
      )?.s.toString(),
    ).toMatchSnapshot()
  })
})
