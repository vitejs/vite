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
  untilUpdated,
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
  })

  test('deps reload', async () => {
    const envs = ['client', 'server'] as const

    const clientMeta = readDepOptimizationMetadata('client')
    const ssrMeta = readDepOptimizationMetadata('ssr')
    expect(clientMeta.optimized['react-fake-client']).toBeFalsy()
    expect(clientMeta.optimized['react-fake-server']).toBeFalsy()
    expect(ssrMeta.optimized['react-fake-server']).toBeFalsy()
    expect(ssrMeta.optimized['react-fake-client']).toBeFalsy()

    envs.forEach((env) => {
      const filePath = path.resolve(testDir, `src/entry-${env}.tsx`)
      const originalContent = readFile(filePath)
      fs.writeFileSync(
        filePath,
        `import 'react-fake-${env}'\n${originalContent}`,
        'utf-8',
      )
      onTestFinished(() => {
        fs.writeFileSync(filePath, originalContent, 'utf-8')
      })
    })

    await untilUpdated(
      () =>
        serverLogs
          .map(
            (log) =>
              stripVTControlCharacters(log).match(
                /new dependencies optimized: (react-fake-.*)/,
              )?.[1],
          )
          .filter(Boolean)
          .join(', '),
      'react-fake-server, react-fake-client',
    )

    const clientMetaNew = readDepOptimizationMetadata('client')
    const ssrMetaNew = readDepOptimizationMetadata('ssr')
    expect(clientMetaNew.optimized['react-fake-client']).toBeTruthy()
    expect(clientMetaNew.optimized['react-fake-server']).toBeFalsy()
    expect(ssrMetaNew.optimized['react-fake-server']).toBeTruthy()
    expect(ssrMetaNew.optimized['react-fake-client']).toBeFalsy()
  })
})
