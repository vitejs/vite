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

test('css @import dependencies', async () => {
  const fixtureDir = fileURLToPath(
    new URL('./fixtures/license', import.meta.url),
  )
  const result = (await build({
    root: fixtureDir,
    logLevel: 'silent',
    build: {
      write: false,
      license: {
        fileName: '.vite/license.json',
      },
      rolldownOptions: {
        input: fileURLToPath(
          new URL('./fixtures/license/entry-css.js', import.meta.url),
        ),
      },
    },
  })) as RollupOutput
  const licenseAsset = result.output.find(
    (asset) => asset.fileName === '.vite/license.json',
  ) as OutputAsset | undefined
  expect(licenseAsset).toBeDefined()
  const licenses = JSON.parse(licenseAsset!.source as string)
  expect(licenses.map((l: any) => l.name)).toContain(
    '@vitejs/test-dep-license-mit',
  )
})

test('pure css entry @import dependencies', async () => {
  const fixtureDir = fileURLToPath(
    new URL('./fixtures/license', import.meta.url),
  )
  const result = (await build({
    root: fixtureDir,
    logLevel: 'silent',
    build: {
      write: false,
      license: {
        fileName: '.vite/license.json',
      },
      rolldownOptions: {
        input: fileURLToPath(
          new URL('./fixtures/license/app.css', import.meta.url),
        ),
      },
    },
  })) as RollupOutput
  const licenseAsset = result.output.find(
    (asset) => asset.fileName === '.vite/license.json',
  ) as OutputAsset | undefined
  expect(licenseAsset).toBeDefined()
  const licenses = JSON.parse(licenseAsset!.source as string)
  expect(licenses.map((l: any) => l.name)).toContain(
    '@vitejs/test-dep-license-mit',
  )
})

test('worker sub-build dependencies', async () => {
  const fixtureDir = fileURLToPath(
    new URL('./fixtures/license', import.meta.url),
  )
  const result = (await build({
    root: fixtureDir,
    logLevel: 'silent',
    build: {
      write: false,
      license: {
        fileName: '.vite/license.json',
      },
      rolldownOptions: {
        input: fileURLToPath(
          new URL('./fixtures/license/entry-worker.js', import.meta.url),
        ),
      },
    },
  })) as RollupOutput
  const licenseAsset = result.output.find(
    (asset) => asset.fileName === '.vite/license.json',
  ) as OutputAsset | undefined
  expect(licenseAsset).toBeDefined()
  const licenses = JSON.parse(licenseAsset!.source as string)
  expect(licenses.map((l: any) => l.name)).toContain(
    '@vitejs/test-dep-license-mit',
  )
})
