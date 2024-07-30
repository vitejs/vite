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
