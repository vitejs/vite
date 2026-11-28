import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, onTestFinished, test } from 'vitest'
import { PartialEnvironment } from '../baseEnvironment'
import { resolveConfig } from '../config'
import type { Environment } from '../environment'
import { createIsConfiguredAsExternal, shouldExternalize } from '../external'

describe('createIsConfiguredAsExternal', () => {
  test('default', async () => {
    const isExternal = await createIsExternal()
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(false)
  })

  test('force external', async () => {
    const isExternal = await createIsExternal(true)
    expect(isExternal('@vitejs/cjs-ssr-dep')).toBe(true)
  })

  test('does not externalize nested dependency copy differing from root in build', async () => {
    const tmpDir = createNestedDepFixture()
    onTestFinished(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

    const rootEntry = path.join(tmpDir, 'src/entry.js')
    const nestedImporter = path.join(tmpDir, 'node_modules/lib/index.js')

    const isExternal = await createIsExternal(undefined, 'build', tmpDir)
    expect(isExternal('nested-dep', rootEntry)).toBe(true)
    expect(isExternal('nested-dep', nestedImporter)).toBe(false)

    const isExplicitExternal = await createIsExternal(
      ['nested-dep'],
      'build',
      tmpDir,
    )
    expect(isExplicitExternal('nested-dep', nestedImporter)).toBe(true)
  })
})

describe('shouldExternalize', () => {
  test('caches externalization decision per importer directory', async () => {
    const tmpDir = createNestedDepFixture()
    onTestFinished(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

    const rootEntry = path.join(tmpDir, 'src/entry.js')
    const nestedImporter = path.join(tmpDir, 'node_modules/lib/index.js')

    const resolvedConfig = await resolveConfig(
      {
        configFile: false,
        root: tmpDir,
        build: { ssr: true },
      },
      'build',
    )
    const environment = new PartialEnvironment('ssr', resolvedConfig)
    // PartialEnvironment satisfies Environment's config property needed by shouldExternalize
    expect(
      shouldExternalize(environment as Environment, 'nested-dep', rootEntry),
    ).toBe(true)
    expect(
      shouldExternalize(
        environment as Environment,
        'nested-dep',
        nestedImporter,
      ),
    ).toBe(false)
  })
})

async function createIsExternal(
  external?: true | string[],
  command: 'serve' | 'build' = 'serve',
  root = fileURLToPath(new URL('./', import.meta.url)),
) {
  const resolvedConfig = await resolveConfig(
    {
      configFile: false,
      root,
      resolve: { external },
      ...(command === 'build' ? { build: { ssr: true } } : {}),
    },
    command,
  )
  const environment = new PartialEnvironment('ssr', resolvedConfig)
  return createIsConfiguredAsExternal(environment)
}

function createNestedDepFixture() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-external-test-'))
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, 'src/entry.js'), '')

  // Root copy
  fs.mkdirSync(path.join(tmpDir, 'node_modules/nested-dep'), {
    recursive: true,
  })
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/nested-dep/package.json'),
    JSON.stringify({
      name: 'nested-dep',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/nested-dep/index.js'),
    'export const value = "root"\n',
  )

  // Package with its own nested copy
  fs.mkdirSync(path.join(tmpDir, 'node_modules/lib/node_modules/nested-dep'), {
    recursive: true,
  })
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/lib/package.json'),
    JSON.stringify({
      name: 'lib',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/lib/index.js'),
    'export { value } from "nested-dep"\n',
  )
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/lib/node_modules/nested-dep/package.json'),
    JSON.stringify({
      name: 'nested-dep',
      version: '2.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(
    path.join(tmpDir, 'node_modules/lib/node_modules/nested-dep/index.js'),
    'export const value = "nested"\n',
  )

  return tmpDir
}
