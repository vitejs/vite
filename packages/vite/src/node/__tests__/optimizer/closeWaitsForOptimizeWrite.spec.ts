import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'
import { promiseWithResolvers } from '../../../shared/utils'

let servers: ViteDevServer[] = []
let root: string | undefined
let releaseWrite: (() => void) | undefined

afterEach(async () => {
  releaseWrite?.()
  await Promise.allSettled(servers.map((server) => server.close()))
  servers = []
  releaseWrite = undefined
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

test('waits for an in-flight optimizeDeps write before closing', async () => {
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-close-write-'),
  )
  const cacheDir = path.join(root, '.vite')
  const depDir = path.join(root, 'node_modules', 'test-close-write-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({
      name: 'test-close-write-dep',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(
    path.join(depDir, 'index.js'),
    'export const marker = "close-write"\n',
  )
  fs.writeFileSync(
    path.join(root, 'entry.js'),
    'import { marker } from "test-close-write-dep"; export { marker }\n',
  )

  const writesStarted = promiseWithResolvers<void>()
  const finishWrite = promiseWithResolvers<void>()
  releaseWrite = finishWrite.resolve
  let writesStartedCount = 0
  servers = await Promise.all(
    [0, 1].map((index) =>
      createServer({
        configFile: false,
        root,
        cacheDir: path.join(cacheDir, `server-${index}`),
        logLevel: 'silent',
        optimizeDeps: {
          entries: ['entry.js'],
          force: true,
          rolldownOptions: {
            plugins: [
              {
                name: 'test:hold-optimize-write',
                generateBundle() {
                  writesStartedCount++
                  if (writesStartedCount === 2) writesStarted.resolve()
                  return finishWrite.promise
                },
              },
            ],
          },
        },
        server: { middlewareMode: true, ws: false },
      }),
    ),
  )

  await Promise.all(servers.map((server) => server.ssrLoadModule('/entry.js')))
  await writesStarted.promise

  const temporaryCacheDirs = servers.map((server) => {
    const temporaryCacheDir = path.join(
      server.config.cacheDir,
      fs
        .readdirSync(server.config.cacheDir)
        .find((entry) => entry.startsWith('deps_temp_'))!,
    )
    expect(fs.existsSync(temporaryCacheDir)).toBe(true)
    return temporaryCacheDir
  })

  let closeCount = 0
  const closePromises = servers.map((server) =>
    server.close().then(() => {
      closeCount++
    }),
  )
  const closePromise = Promise.all(closePromises)

  try {
    // Shutdown must wait until Rolldown finishes writing its temporary output.
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(closeCount).toBe(0)
    expect(temporaryCacheDirs.every((dir) => fs.existsSync(dir))).toBe(true)

    finishWrite.resolve()
    await closePromise

    expect(temporaryCacheDirs.every((dir) => !fs.existsSync(dir))).toBe(true)
  } finally {
    finishWrite.resolve()
    await closePromise
  }
})
