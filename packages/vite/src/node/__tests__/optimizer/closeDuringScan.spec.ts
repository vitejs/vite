import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'
import { promiseWithResolvers } from '../../../shared/utils'

let server: ViteDevServer | undefined
let root: string | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
  if (root) fs.rmSync(root, { recursive: true, force: true })
  root = undefined
})

test.each([false, true])(
  'does not start post-scan optimization after close (requests idle first: %s)',
  async (idleFirst) => {
    root = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-close-scan-'),
    )
    const cacheDir = path.join(root, '.vite')
    fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}\n')
    fs.writeFileSync(path.join(root, 'entry.js'), 'export const answer = 42\n')

    const scanStarted = promiseWithResolvers<void>()
    const releaseScan = promiseWithResolvers<void>()

    server = await createServer({
      configFile: false,
      root,
      cacheDir,
      logLevel: 'silent',
      optimizeDeps: {
        force: true,
        noDiscovery: false,
        entries: ['entry.js'],
        rolldownOptions: {
          plugins: [
            {
              name: 'test:hold-dependency-scan',
              async buildStart() {
                scanStarted.resolve()
                await releaseScan.promise
              },
            },
          ],
        },
      },
      server: { port: 0, ws: false },
    })

    await server.listen()
    await scanStarted.promise
    if (idleFirst) {
      await server.environments.client.waitForRequestsIdle()
    }

    let closed = false
    const closePromise = server.close().then(() => {
      closed = true
    })
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(closed).toBe(false)

    releaseScan.resolve()
    await closePromise
    server = undefined

    await setTimeout(100)
    const leftovers = fs.existsSync(cacheDir)
      ? fs.readdirSync(cacheDir).filter((name) => name.startsWith('deps_temp'))
      : []
    expect(leftovers).toStrictEqual([])
  },
)
