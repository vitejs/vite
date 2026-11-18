import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createServer } from '../..'
import {
  initDepsOptimizerMetadata,
  runOptimizeDeps,
  toDiscoveredDependencies,
} from '../../optimizer'

// tsconfig lookup is skipped for files in node_modules, but it applies to
// dependencies outside of it, e.g. linked packages
test('optimizer respects the top-level tsconfig option', async (ctx) => {
  const root = path.join(import.meta.dirname, '../fixtures/scan-tsconfig')
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-optimizer-'))
  ctx.onTestFinished(() => fs.rmSync(cacheDir, { recursive: true }))

  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    root,
    cacheDir,
    // `src/tsconfig.json` extends a missing file and would fail the bundling
    // if it was picked up instead of the selected tsconfig
    tsconfig: 'tsconfig.selected.json',
    optimizeDeps: { noDiscovery: true },
  })
  ctx.onTestFinished(() => server.close())

  const environment = server.environments.client
  const { cancel, result } = runOptimizeDeps(
    environment,
    toDiscoveredDependencies(environment, {
      main: path.join(root, 'src/main.ts'),
    }),
  )
  ctx.onTestFinished(cancel)

  await expect(result).resolves.toHaveProperty('metadata')
})

test('changing the top-level tsconfig option changes the config hash', async (ctx) => {
  const getConfigHash = async (tsconfig: string | undefined) => {
    const server = await createServer({
      configFile: false,
      logLevel: 'error',
      root: path.join(import.meta.dirname, '../fixtures/scan-tsconfig'),
      tsconfig,
      optimizeDeps: { noDiscovery: true },
    })
    ctx.onTestFinished(() => server.close())
    return initDepsOptimizerMetadata(server.environments.client).configHash
  }

  const selected = await getConfigHash('tsconfig.selected.json')
  expect(await getConfigHash('tsconfig.selected.json')).toBe(selected)
  expect(await getConfigHash('tsconfig.other.json')).not.toBe(selected)
})
