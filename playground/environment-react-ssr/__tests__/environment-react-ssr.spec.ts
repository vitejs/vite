import fs from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { describe, expect, onTestFinished, test } from 'vitest'
import {
  bundledDevTodo,
  bundledDevUnsupported,
  isBuild,
  page,
  readDepOptimizationMetadata,
  readFile,
  serverLogs,
  testDir,
} from '~utils'

const clientOptimizerUnsupported = bundledDevUnsupported(
  'bundled dev has no dep optimizer for the client environment, so there is no client `.vite/deps` metadata',
)

test(
  'basic',
  bundledDevTodo(
    '`server.transformIndexHtml` currently returns HTML that points at the source files, not at the files bundled dev produces; how it should work in bundled dev is not decided yet, e.g. return the HTML that the build HTML plugin emits as `index.html` in `bundledDev.memoryFiles`',
    { vite: [20374] },
  ),
  async () => {
    await expect
      .poll(() => page.getByText('hydrated: true').isVisible())
      .toBe(true)
    await expect.poll(() => page.getByText('Count: 0').isVisible()).toBe(true)
    await page.getByRole('button', { name: '+' }).click()
    await expect.poll(() => page.getByText('Count: 1').isVisible()).toBe(true)
  },
)

describe.runIf(!isBuild)('pre-bundling', () => {
  test('client', clientOptimizerUnsupported, async () => {
    const metaJson = readDepOptimizationMetadata()

    expect(metaJson.optimized['react']).toBeDefined()
    expect(metaJson.optimized['react-dom/client']).toBeDefined()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeDefined()

    expect(metaJson.optimized['react-dom/server']).toBeUndefined()
  })

  test('ssr', async () => {
    const metaJson = readDepOptimizationMetadata('ssr')

    expect(metaJson.optimized['react']).toBeDefined()
    expect(metaJson.optimized['react-dom/server']).toBeDefined()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeDefined()

    expect(metaJson.optimized['react-dom/client']).toBeUndefined()

    // process.env.NODE_ENV should be kept as keepProcessEnv is true
    const depsFiles = fs
      .readdirSync(path.resolve(testDir, 'node_modules/.vite/deps_ssr'), {
        withFileTypes: true,
      })
      .filter((file) => file.isFile() && file.name.endsWith('.js'))
      .map((file) => path.join(file.parentPath, file.name))
    const depsFilesWithProcessEnvNodeEnv = depsFiles.filter((file) =>
      fs.readFileSync(file, 'utf-8').includes('process.env.NODE_ENV'),
    )

    expect(depsFilesWithProcessEnvNodeEnv.length).toBeGreaterThan(0)
  })

  function addImport(entry: 'client' | 'server') {
    const filePath = path.resolve(testDir, `src/entry-${entry}.tsx`)
    const originalContent = readFile(filePath)
    fs.writeFileSync(
      filePath,
      `import 'react-fake-${entry}'\n${originalContent}`,
      'utf-8',
    )
    onTestFinished(() => {
      fs.writeFileSync(filePath, originalContent, 'utf-8')
    })
  }

  function optimizedFakeDeps() {
    return serverLogs
      .map(
        (log) =>
          stripVTControlCharacters(log).match(
            /dependenc(?:y|ies) optimized: (react-fake-.*)/,
          )?.[1],
      )
      .filter(Boolean)
  }

  test('deps reload (client)', clientOptimizerUnsupported, async () => {
    const clientMeta = readDepOptimizationMetadata('client')
    expect(clientMeta.optimized['react-fake-client']).toBeUndefined()
    expect(clientMeta.optimized['react-fake-server']).toBeUndefined()

    addImport('client')

    await expect.poll(optimizedFakeDeps).toContain('react-fake-client')

    const clientMetaNew = readDepOptimizationMetadata('client')
    expect(clientMetaNew.optimized['react-fake-client']).toBeDefined()
    expect(clientMetaNew.optimized['react-fake-server']).toBeUndefined()
  })

  test(
    'deps reload (ssr)',
    bundledDevTodo(
      'under bundled dev, file changes are only handled for the bundled client environment, so the ssr environment keeps running the old code until restart',
    ),
    async () => {
      const ssrMeta = readDepOptimizationMetadata('ssr')
      expect(ssrMeta.optimized['react-fake-server']).toBeUndefined()
      expect(ssrMeta.optimized['react-fake-client']).toBeUndefined()

      addImport('server')

      await expect.poll(optimizedFakeDeps).toContain('react-fake-server')

      const ssrMetaNew = readDepOptimizationMetadata('ssr')
      expect(ssrMetaNew.optimized['react-fake-server']).toBeDefined()
      expect(ssrMetaNew.optimized['react-fake-client']).toBeUndefined()
    },
  )
})
