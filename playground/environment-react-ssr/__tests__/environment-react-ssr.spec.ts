import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import type { DepOptimizationMetadata } from 'vite'
import {
  isBuild,
  page,
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
    const meta = await readFile('node_modules/.vite/deps/_metadata.json')
    const metaJson: DepOptimizationMetadata = JSON.parse(meta)

    expect(metaJson.optimized['react']).toBeTruthy()
    expect(metaJson.optimized['react-dom/client']).toBeTruthy()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeTruthy()

    expect(metaJson.optimized['react-dom/server']).toBeFalsy()
  })

  test('ssr', async () => {
    const meta = await readFile('node_modules/.vite/deps_ssr/_metadata.json')
    const metaJson: DepOptimizationMetadata = JSON.parse(meta)

    expect(metaJson.optimized['react']).toBeTruthy()
    expect(metaJson.optimized['react-dom/server']).toBeTruthy()
    expect(metaJson.optimized['react/jsx-dev-runtime']).toBeTruthy()

    expect(metaJson.optimized['react-dom/client']).toBeFalsy()
  })

  test('deps reload', async () => {
    const envs = ['client', 'server'] as const

    const getMeta = (env: (typeof envs)[number]): DepOptimizationMetadata => {
      const meta = readFile(
        `node_modules/.vite/deps${env === 'client' ? '' : '_ssr'}/_metadata.json`,
      )
      return JSON.parse(meta)
    }

    expect(getMeta('client').optimized['react-fake-client']).toBeFalsy()
    expect(getMeta('client').optimized['react-fake-server']).toBeFalsy()
    expect(getMeta('server').optimized['react-fake-server']).toBeFalsy()
    expect(getMeta('server').optimized['react-fake-client']).toBeFalsy()

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
              log
                // eslint-disable-next-line no-control-regex
                .replace(/\x1B\[\d+m/g, '')
                .match(/new dependencies optimized: (react-fake-.*)/)?.[1],
          )
          .filter(Boolean)
          .join(', '),
      'react-fake-server, react-fake-client',
    )

    expect(getMeta('client').optimized['react-fake-client']).toBeTruthy()
    expect(getMeta('client').optimized['react-fake-server']).toBeFalsy()
    expect(getMeta('server').optimized['react-fake-server']).toBeTruthy()
    expect(getMeta('server').optimized['react-fake-client']).toBeFalsy()
  })
})
