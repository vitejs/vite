import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'

let server: ViteDevServer | undefined
let root: string | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

test('does not inline hidden source maps into optimized dependency responses', async () => {
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-hidden-map-'),
  )
  const depDir = path.join(root, 'node_modules', 'source-map-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({
      name: 'source-map-dep',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(path.join(depDir, 'index.js'), 'export const value = 1\n')

  server = await createServer({
    configFile: false,
    root,
    cacheDir: 'node_modules/.vite',
    logLevel: 'silent',
    optimizeDeps: {
      force: true,
      noDiscovery: true,
      include: ['source-map-dep'],
    },
    server: { port: 0 },
  })
  await server.listen()

  const depsOptimizer = server.environments.client.depsOptimizer!
  await depsOptimizer.scanProcessing
  const depInfo = depsOptimizer.metadata.optimized['source-map-dep']
  expect(depInfo).toBeDefined()

  const baseUrl = server.resolvedUrls!.local[0]
  const response = await fetch(
    new URL(
      `/node_modules/.vite/deps/source-map-dep.js?v=${depInfo.browserHash}`,
      baseUrl,
    ),
  )
  expect(response.status).toBe(200)
  expect(await response.text()).not.toContain('sourceMappingURL=data:')

  const mapResponse = await fetch(
    new URL('/node_modules/.vite/deps/source-map-dep.js.map', baseUrl),
  )
  expect(mapResponse.status).toBe(200)
  expect((await mapResponse.json()).sources).toHaveLength(1)
})
