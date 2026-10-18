import { fileURLToPath } from 'node:url'
import type { OutputAsset, RollupOutput } from 'rollup'
import { expect, test } from 'vitest'
import { build } from '../../build'

// #23819: two adjacent module scripts on the first line of index.html.
// The original tag of the second script must be removed together with the
// first one, instead of being left behind (with its final `>` cut off).
test('removes both adjacent module scripts on the first line', async () => {
  const result = (await build({
    root: fileURLToPath(
      new URL('../fixtures/html-adjacent-module-scripts', import.meta.url),
    ),
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
    },
  })) as RollupOutput

  const html = result.output.find(
    (asset) => asset.type === 'asset' && asset.fileName === 'index.html',
  ) as OutputAsset | undefined
  expect(html).toBeDefined()

  const source = html!.source as string
  expect(source).not.toContain('/b.js')
  expect(source.trimEnd().endsWith('>')).toBe(true)

  // Both entries are still bundled into the output chunk.
  const chunk = result.output.find(
    (asset) => asset.type === 'chunk' && asset.isEntry,
  ) as { code: string } | undefined
  expect(chunk).toBeDefined()
  expect(chunk!.code).toContain('module a')
  expect(chunk!.code).toContain('module b')
})
