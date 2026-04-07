import { resolve } from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import type { Plugin } from '../../plugin'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'
import { arraify } from '../../utils'

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
  const plugins = arraify(importGlobPlugin(config))
  const environment = new PartialEnvironment('client', config)
  const id = resolve(config.root, 'packages/vite/src/node/entry.ts')

  return async (code: string) => {
    let currentCode = code

    for (const plugin of plugins) {
      const transform = plugin.transform
      if (!transform) continue
      const filter =
        typeof transform === 'object' ? transform.filter : undefined
      if (filter && 'code' in filter) {
        const codeFilter = filter.code
        if (
          typeof codeFilter === 'string' &&
          !currentCode.includes(codeFilter)
        ) {
          continue
        }
        if (codeFilter instanceof RegExp && !codeFilter.test(currentCode)) {
          continue
        }
      }
      const handler =
        typeof transform === 'function' ? transform : transform.handler
      if (!handler) continue

      const result = await handler.call(
        { environment, resolve: async (id: string) => ({ id }) },
        currentCode,
        id,
      )

      if (result && typeof result === 'object' && 'code' in result) {
        currentCode = result.code || currentCode
      } else if (typeof result === 'string') {
        currentCode = result
      }
    }

    return currentCode
  }
}

describe('importGlobPlugin (build)', () => {
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
})
