import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { transformGlobImport } from '../../../plugins/importMetaGlob'
import { transformWithEsbuild } from '../../../plugins/esbuild'
import type { Logger } from '../../../logger'
import { createLogger } from '../../../logger'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

describe('fixture', async () => {
  const resolveId = (id: string) => id
  const root = resolve(__dirname, '..')
  const logger = createLogger()

  it('transform', async () => {
    const id = resolve(__dirname, './fixture-a/index.ts')
    const code = (
      await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)
    ).code

    expect(
      (
        await transformGlobImport(code, id, root, resolveId, logger)
      )?.s.toString()
    ).toMatchSnapshot()
  })

  it('preserve line count', async () => {
    const getTransformedLineCount = async (code: string) =>
      (
        await transformGlobImport(
          code,
          'virtual:module',
          root,
          resolveId,
          logger
        )
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
        `.trim()
      )
    ).toBe(3)
  })

  it('virtual modules', async () => {
    const root = resolve(__dirname, './fixture-a')
    const code = [
      "import.meta.glob('/modules/*.ts')",
      "import.meta.glob(['/../fixture-b/*.ts'])"
    ].join('\n')
    expect(
      (
        await transformGlobImport(
          code,
          'virtual:module',
          root,
          resolveId,
          logger
        )
      )?.s.toString()
    ).toMatchSnapshot()

    try {
      await transformGlobImport(
        "import.meta.glob('./modules/*.ts')",
        'virtual:module',
        root,
        resolveId,
        logger
      )
      expect('no error').toBe('should throw an error')
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        "[Error: In virtual modules, all globs must start with '/']"
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
        await transformGlobImport(code, id, root, resolveId, logger, true)
      )?.s.toString()
    ).toMatchSnapshot()
  })

  it('warn when glob css without ?inline', async () => {
    const logs: string[] = []
    const logger = {
      warn(msg: string) {
        logs.push(msg)
      }
    } as Logger

    await transformGlobImport(
      "import.meta.glob('./fixture-c/*.css', { query: '?inline' })",
      fileURLToPath(import.meta.url),
      root,
      resolveId,
      logger
    )
    expect(logs).toHaveLength(0)

    await transformGlobImport(
      "import.meta.glob('./fixture-c/*.module.css')",
      fileURLToPath(import.meta.url),
      root,
      resolveId,
      logger
    )
    expect(logs).toHaveLength(0)

    await transformGlobImport(
      "import.meta.glob('./fixture-c/*.css')",
      fileURLToPath(import.meta.url),
      root,
      resolveId,
      logger
    )
    expect(logs).toHaveLength(1)
    expect(logs[0]).to.include(
      'Globbing CSS files without the ?inline query is deprecated'
    )
  })
})
