import { resolve } from 'node:path'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { Plugin } from '../../plugin'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'

const { nativeTransformHandler } = vi.hoisted(() => ({
  nativeTransformHandler: vi.fn(async () => ({
    code: '/* native import glob transform */',
  })),
}))

vi.mock('rolldown/experimental', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rolldown/experimental')>()
  return {
    ...actual,
    viteImportGlobPlugin: vi.fn(
      (): Plugin => ({
        name: 'mock-native-import-glob',
        transform: {
          filter: { code: 'import.meta.glob' },
          handler: nativeTransformHandler,
        },
      }),
    ),
  }
})

async function createBuildImportGlobTransform() {
  const config = await resolveConfig({ configFile: false }, 'build')
  expect(config.isBundled).toBe(true)
  const { importGlobPlugin } = await import('../../plugins/importMetaGlob')
  const plugin = importGlobPlugin(config)
  const environment = new PartialEnvironment('client', config)
  const id = resolve(config.root, 'packages/vite/src/node/entry.ts')

  return async (code: string) => {
    // The build path must keep using the JS transformer so array globs are
    // resolved the same way as in dev.
    // @ts-expect-error transform.handler should exist
    const result = await plugin.transform.handler.call(
      { environment, resolve: async (id: string) => ({ id }) },
      code,
      id,
    )

    return result?.code || result
  }
}

describe('importGlobPlugin (build)', () => {
  beforeEach(() => {
    nativeTransformHandler.mockClear()
  })

  test('transforms array globs in build mode', async () => {
    const transform = await createBuildImportGlobTransform()
    const result = await transform(`
      export const modules = import.meta.glob([
        './__tests__/plugins/importGlob/fixture-a/modules/*.ts',
        '!./__tests__/plugins/importGlob/fixture-a/modules/index.ts',
      ], { eager: true, import: 'name' })
    `)

    expect(result).toContain(
      'import { name as __vite_glob_0_0 } from "./__tests__/plugins/importGlob/fixture-a/modules/a.ts"',
    )
    expect(result).toContain(
      '"./__tests__/plugins/importGlob/fixture-a/modules/a.ts": __vite_glob_0_0',
    )
    expect(result).toContain(
      '"./__tests__/plugins/importGlob/fixture-a/modules/b.ts": __vite_glob_0_1',
    )
    expect(result).not.toContain('modules/index.ts')
    expect(result).not.toContain('Object.assign({})')
    expect(nativeTransformHandler).not.toHaveBeenCalled()
  })

  test('string globs still use native plugin in bundled build', async () => {
    const transform = await createBuildImportGlobTransform()
    const result = await transform(`
      export const modules = import.meta.glob(
        './__tests__/plugins/importGlob/fixture-a/modules/*.ts',
        { eager: true }
      )
    `)

    expect(result).toBe('/* native import glob transform */')
    expect(nativeTransformHandler).toHaveBeenCalledOnce()
  })
})
