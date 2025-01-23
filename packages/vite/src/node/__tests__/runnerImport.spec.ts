import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { loadConfigFromFile } from 'vite'
import { runnerImport } from '../ssr/runnerImport'
import { slash } from '../../shared/utils'

describe('importing files using inlined environment', () => {
  const fixture = (name: string) =>
    resolve(import.meta.dirname, './fixtures/runner-import', name)

  test('importing a basic file works', async () => {
    const { module } = await runnerImport<
      typeof import('./fixtures/runner-import/basic')
    >(fixture('basic'))
    expect(module.test).toEqual({
      field: true,
    })
  })

  test("cannot import cjs, 'runnerImport' doesn't support CJS syntax at all", async () => {
    await expect(() =>
      runnerImport<typeof import('./fixtures/runner-import/basic')>(
        fixture('cjs.js'),
      ),
    ).rejects.toThrow('module is not defined')
  })

  test('can import vite config', async () => {
    const { module, dependencies } = await runnerImport<
      typeof import('./fixtures/runner-import/vite.config')
    >(fixture('vite.config'))
    expect(module.default).toEqual({
      root: './test',
      plugins: [
        {
          name: 'test',
        },
      ],
    })
    expect(dependencies).toEqual([slash(fixture('plugin.ts'))])
  })

  test('can import vite config that imports a TS external module', async () => {
    const { module, dependencies } = await runnerImport<
      typeof import('./fixtures/runner-import/vite.config.outside-pkg-import.mjs')
    >(fixture('vite.config.outside-pkg-import.mts'))

    expect(module.default.__injected).toBe(true)
    expect(dependencies).toEqual([
      slash(resolve(import.meta.dirname, './packages/parent/index.ts')),
    ])

    // confirm that it fails with a bundle approach
    await expect(async () => {
      const root = resolve(import.meta.dirname, './fixtures/runner-import')
      await loadConfigFromFile(
        { mode: 'production', command: 'serve' },
        resolve(root, './vite.config.outside-pkg-import.mts'),
        root,
        'silent',
      )
    }).rejects.toThrow('Unknown file extension ".ts"')
  })

  test('dynamic import', async () => {
    const { module } = await runnerImport<any>(fixture('dynamic-import.ts'))
    await expect(() => module.default()).rejects.toMatchInlineSnapshot(
      `[Error: Vite module runner has been closed.]`,
    )
    // const dep = await module.default();
    // expect(dep.default).toMatchInlineSnapshot(`"ok"`)
  })
})
