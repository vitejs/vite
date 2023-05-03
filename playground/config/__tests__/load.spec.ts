import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile } from 'vite'
import { expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
