import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { expect, it } from 'vitest'

const [nvMajor, nvMinor] = process.versions.node.split('.').map(Number)
const isImportAttributesSupported =
  (nvMajor === 18 && nvMinor >= 20) ||
  // Node v19 doesn't support import attributes
  (nvMajor === 20 && nvMinor >= 10) ||
  nvMajor >= 21

it('loadConfigFromFile', async () => {
  const { config } = await loadConfigFromFile(
    {} as any,
    resolve(__dirname, '../packages/entry/vite.config.ts'),
    resolve(__dirname, '../packages/entry'),
  )
  expect(config).toMatchInlineSnapshot(`
    {
      "array": [
        [
          1,
          3,
        ],
        [
          2,
          4,
        ],
      ],
      "moduleCondition": "import condition",
    }
  `)
})

it.runIf(isImportAttributesSupported)(
  'loadConfigFromFile with import attributes',
  async () => {
    const { config } = await loadConfigFromFile(
      {} as any,
      resolve(__dirname, '../packages/entry/vite.config.import-attributes.ts'),
      resolve(__dirname, '../packages/entry'),
    )
    expect(config).toMatchInlineSnapshot(`
      {
        "jsonValue": "vite",
      }
    `)
  },
)

it('dynamic import', async () => {
  const { config } = (await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    resolve(__dirname, '../packages/entry/vite.config.dynamic.ts'),
  )) as any
  expect(await config.knownImport()).toMatchInlineSnapshot(`
    {
      "default": "ok",
    }
  `)
  expect(await config.rawImport('../siblings/ok.js')).toMatchInlineSnapshot(`
    {
      "default": "ok",
    }
  `)
  // two are different since one is bundled but the other is from node
  expect(await config.knownImport()).not.toBe(
    await config.rawImport('../siblings/ok.js'),
  )

  expect(await config.rawImport('@vite/test-config-plugin-module-condition'))
    .toMatchInlineSnapshot(`
    {
      "default": "import condition",
    }
  `)

  // importing "./ok.js" inside "siblings/dynamic.js" should resolve to "siblings/ok.js"
  // but this case has never been supported.
  await expect(() => config.siblingsDynamic('./ok.js')).rejects.toThrow(
    'Cannot find module',
  )

  await expect(() =>
    config.siblingsDynamic('no-such-module'),
  ).rejects.toMatchInlineSnapshot(
    `[Error: Failed to resolve dynamic import 'no-such-module']`,
  )
})
