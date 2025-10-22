import { fileURLToPath } from 'node:url'
import type { OutputAsset, RollupOutput } from 'rollup'
import { expect, test } from 'vitest'
import { build } from '../../build'

test('markdown', async () => {
  const result = (await build({
    root: fileURLToPath(new URL('./fixtures/license', import.meta.url)),
    logLevel: 'silent',
    build: {
      write: false,
      license: true,
    },
  })) as RollupOutput
  const licenseAsset = result.output.find(
    (asset) => asset.fileName === '.vite/license.md',
  ) as OutputAsset | undefined
  expect(licenseAsset).toBeDefined()
  expect(licenseAsset?.source).toMatchSnapshot()
})

test('json', async () => {
  const result = (await build({
    root: fileURLToPath(new URL('./fixtures/license', import.meta.url)),
    logLevel: 'silent',
    build: {
      write: false,
      license: {
        fileName: '.vite/license.json',
      },
    },
  })) as RollupOutput
  const licenseAsset = result.output.find(
    (asset) => asset.fileName === '.vite/license.json',
  ) as OutputAsset | undefined
  expect(licenseAsset).toBeDefined()
  expect(licenseAsset?.source).toMatchSnapshot()
})
