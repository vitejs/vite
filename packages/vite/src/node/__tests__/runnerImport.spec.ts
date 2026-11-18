import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { slash } from '../../shared/utils'
import { runnerImport } from '../ssr/runnerImport'

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const isTypeStrippingSupported = !!process.features.typescript

describe('importing files using inlined environment', () => {
  const fixture = (name: string) =>
    resolve(import.meta.dirname, './fixtures/runner-import', name)

  test('importing a basic file works', async () => {
    const { module } = await runnerImport<
      typeof import('./fixtures/runner-import/basic')
    >(fixture('basic'))
    expect(module.test).toStrictEqual({
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
    expect(module.default).toStrictEqual({
      root: './test',
      plugins: [
        {
          name: 'test',
        },
      ],
    })
    expect(dependencies).toStrictEqual([slash(fixture('plugin.ts'))])
  })

  test('can import vite config that imports a TS external module', async () => {
    const { module, dependencies } = await runnerImport<
      typeof import('./fixtures/runner-import/vite.config.outside-pkg-import.mjs')
    >(fixture('vite.config.outside-pkg-import.mts'))

    expect(module.default.__injected).toBe(true)
    expect(dependencies).toStrictEqual([
      slash(resolve(import.meta.dirname, './packages/parent/index.ts')),
    ])

    // confirm that it fails with a bundle approach
    if (!isTypeStrippingSupported) {
      await expect(async () => {
        const root = resolve(import.meta.dirname, './fixtures/runner-import')
        await loadConfigFromFile(
          { mode: 'production', command: 'serve' },
          resolve(root, './vite.config.outside-pkg-import.mts'),
          root,
          'silent',
        )
      }).rejects.toThrow('Unknown file extension ".ts"')
    }
  })

  test.each([undefined, ''])('leaves NODE_ENV as %j', async (nodeEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv)
    try {
      await runnerImport(fixture('basic'))
      expect(process.env.NODE_ENV).toBe(nodeEnv)
      await expect(
        runnerImport(fixture('basic'), {
          plugins: [
            {
              name: 'throw',
              config() {
                throw new Error('config hook')
              },
            },
          ],
        }),
      ).rejects.toThrow('config hook')
      expect(process.env.NODE_ENV).toBe(nodeEnv)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  test('keeps a NODE_ENV set by a config hook', async () => {
    vi.stubEnv('NODE_ENV', undefined)
    try {
      await runnerImport(fixture('basic'), {
        plugins: [
          {
            name: 'set-node-env',
            config() {
              process.env.NODE_ENV = 'production'
            },
          },
        ],
      })
      expect(process.env.NODE_ENV).toBe('production')
    } finally {
      vi.unstubAllEnvs()
    }
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
