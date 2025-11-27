import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { isBuild, testDir, viteServer } from '~utils'

async function loadModule() {
  if (isBuild) {
    const entryFile = path.resolve(testDir, 'dist/main.mjs')
    return import(pathToFileURL(entryFile).href)
  }

  if (!viteServer) {
    throw new Error('Expected dev server to be available in serve mode')
  }

  return viteServer.ssrLoadModule('/main.ts')
}

test('chunk worker responds', async () => {
  const mod = await loadModule()
  expect(await mod.run('ping')).toBe('chunk:ping')
})

test('inline worker responds', async () => {
  const mod = await loadModule()
  expect(await mod.runInline('inline')).toBe('inline:inline')
})

describe.runIf(isBuild)('build output', () => {
  test('emits node worker chunk with node imports', async () => {
    const distPath = path.resolve(testDir, 'dist')
    const mainContent = fs.readFileSync(
      path.join(distPath, 'main.mjs'),
      'utf-8',
    )
    const assetsDir = path.join(distPath, 'assets')
    const assetFiles = fs.readdirSync(assetsDir)
    const workerFile = assetFiles.find((file) => file.includes('worker'))
    expect(workerFile).toBeDefined()
    const workerContent = fs.readFileSync(
      path.join(assetsDir, workerFile!),
      'utf-8',
    )

    expect(mainContent).toMatch(`from "node:worker_threads"`)
    expect(mainContent).toMatch(`from "node:path"`)
    expect(mainContent).toMatch(`from "node:url"`)
    expect(mainContent).toMatch(`pathToFileURL(`)
    expect(mainContent).toMatch(`type == null) workerOptions.type = "module"`)
    expect(workerContent).toMatch(`from"node:worker_threads"`)
  })
})
