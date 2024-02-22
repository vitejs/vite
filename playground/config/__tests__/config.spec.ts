import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { expect, it } from 'vitest'

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

it('tea.yaml matches expected content', () => {
  const filePath = resolve(__dirname, '../../../tea.yaml')
  const yamlContents = fs.readFileSync(filePath, 'utf8')

  const expectedYaml = `# https://tea.xyz/what-is-this-file
---
version: 1.0.0
codeOwners:
  - '0x2F9CbfcE3197F881D2b6F8abF46cdbeB6eFf88A3'
quorum: 1
`

  // Assert that the actual YAML contents match the expected YAML text
  expect(yamlContents).toEqual(expectedYaml)
})
