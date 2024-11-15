import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { inlineImport } from '../ssr/inlineImport'
import { slash } from '../../shared/utils'

describe('importing files using inlined environment', () => {
  const fixture = (name: string) =>
    resolve(import.meta.dirname, './fixtures/inline-import', name)

  test('importing a basic file works', async () => {
    const { module } = await inlineImport<
      typeof import('./fixtures/inline-import/basic')
    >(fixture('basic'))
    expect(module.test).toEqual({
      field: true,
    })
  })

  test("cannot import cjs, 'inlineImport' doesn't support CJS syntax at all", async () => {
    await expect(() =>
      inlineImport<typeof import('./fixtures/inline-import/basic')>(
        fixture('cjs.js'),
      ),
    ).rejects.toThrow('module is not defined')
  })

  test('can import vite config', async () => {
    const { module, dependencies } = await inlineImport<
      typeof import('./fixtures/inline-import/vite.config')
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
})
