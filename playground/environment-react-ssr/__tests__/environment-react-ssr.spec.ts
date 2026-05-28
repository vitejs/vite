import fs from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { describe, expect, onTestFinished, test } from 'vitest'
import {
  isBuild,
  page,
  readDepOptimizationMetadata,
  readFile,
  serverLogs,
  testDir,
  viteServer,
} from '~utils'

test('basic', async () => {
  await page.getByText('hydrated: true').isVisible()
  await page.getByText('Count: 0').isVisible()
  await page.getByRole('button', { name: '+' }).click()
  await page.getByText('Count: 1').isVisible()
})

describe.runIf(!isBuild)('pre-bundling', () => {
  test('client', async () => {
    const metaJson = readDepOptimizationMetadata()

    expect(metaJson.optimized['react']).toBeTruthy()
    expect(metaJson.optimized['react-dom/client']).toBeTruthy()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeTruthy()

    expect(metaJson.optimized['react-dom/server']).toBeFalsy()
  })

  test('ssr', async () => {
    const metaJson = readDepOptimizationMetadata('ssr')

    expect(metaJson.optimized['react']).toBeTruthy()
    expect(metaJson.optimized['react-dom/server']).toBeTruthy()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeTruthy()

    expect(metaJson.optimized['react-dom/client']).toBeFalsy()

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

  test('deps reload', async () => {
    await viteServer.environments.ssr.transformRequest('/src/entry-server.tsx')
    await viteServer.environments.client.waitForRequestsIdle()
    await viteServer.environments.ssr.waitForRequestsIdle()
    await viteServer.environments.client.depsOptimizer?.scanProcessing
    await viteServer.environments.ssr.depsOptimizer?.scanProcessing

    const clientMeta = readDepOptimizationMetadata('client')
    const ssrMeta = readDepOptimizationMetadata('ssr')
    expect(clientMeta.optimized['react-fake-client']).toBeFalsy()
    expect(clientMeta.optimized['picocolors']).toBeFalsy()
    expect(ssrMeta.optimized['picocolors']).toBeFalsy()
    expect(ssrMeta.optimized['react-fake-client']).toBeFalsy()

    const clientFilePath = path.resolve(testDir, 'src/entry-client.tsx')
    const clientOriginalContent = readFile(clientFilePath)
    fs.writeFileSync(
      clientFilePath,
      `import 'react-fake-client'\n${clientOriginalContent}`,
      'utf-8',
    )
    onTestFinished(() => {
      fs.writeFileSync(clientFilePath, clientOriginalContent, 'utf-8')
    })

    const serverFilePath = path.resolve(testDir, 'src/entry-server.tsx')
    const serverOriginalContent = readFile(serverFilePath)
    fs.writeFileSync(
      serverFilePath,
      `import 'picocolors'\n${serverOriginalContent}`,
      'utf-8',
    )
    onTestFinished(() => {
      fs.writeFileSync(serverFilePath, serverOriginalContent, 'utf-8')
    })

    for (const filePath of [clientFilePath, serverFilePath]) {
      await Promise.all(
        Object.values(viteServer.environments).map(async (environment) => {
          await environment.pluginContainer.watchChange(filePath, {
            event: 'update',
          })
          environment.moduleGraph.onFileChange(filePath)
        }),
      )
    }

    const clientResolved =
      await viteServer.environments.client.pluginContainer.resolveId(
        'react-fake-client',
        clientFilePath,
      )
    const ssrResolved =
      await viteServer.environments.ssr.pluginContainer.resolveId(
        'picocolors',
        serverFilePath,
      )
    expect(clientResolved?.id).toContain('/deps/react-fake-client.js?v=')
    expect(ssrResolved?.id).toContain('/deps_ssr/picocolors.js?v=')
    viteServer.environments.client.depsOptimizer?.run()
    viteServer.environments.ssr.depsOptimizer?.run()

    await expect
      .poll(() => ({
        clientFakeClient:
          !!readDepOptimizationMetadata('client').optimized[
            'react-fake-client'
          ],
        clientPicocolors:
          !!readDepOptimizationMetadata('client').optimized['picocolors'],
        ssrPicocolors:
          !!readDepOptimizationMetadata('ssr').optimized['picocolors'],
        ssrFakeClient:
          !!readDepOptimizationMetadata('ssr').optimized['react-fake-client'],
        reloading: serverLogs.some((log) =>
          stripVTControlCharacters(log).includes(
            'optimized dependencies changed. reloading',
          ),
        ),
      }))
      .toStrictEqual({
        clientFakeClient: true,
        clientPicocolors: false,
        ssrPicocolors: true,
        ssrFakeClient: false,
        reloading: false,
      })

    const clientMetaNew = readDepOptimizationMetadata('client')
    const ssrMetaNew = readDepOptimizationMetadata('ssr')
    expect(clientMetaNew.optimized['react-fake-client']).toBeTruthy()
    expect(clientMetaNew.optimized['picocolors']).toBeFalsy()
    expect(ssrMetaNew.optimized['picocolors']).toBeTruthy()
    expect(ssrMetaNew.optimized['react-fake-client']).toBeFalsy()
  })
})
