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

// regression test for https://github.com/vitejs/vite/issues/23752
test('does not leave optimizer output behind when closed while it is writing', async () => {
  root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-close-write-'),
  )
  const cacheDir = path.join(root, '.vite')
  const depDir = path.join(root, 'node_modules', 'close-write-dep')
  fs.mkdirSync(depDir, { recursive: true })
  fs.writeFileSync(
    path.join(depDir, 'package.json'),
    JSON.stringify({
      name: 'close-write-dep',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  )
  fs.writeFileSync(path.join(depDir, 'index.js'), 'export const foo = 1\n')
  fs.writeFileSync(
    path.join(root, 'entry.js'),
    `import { foo } from 'close-write-dep'\nconsole.log(foo)\n`,
  )

  const renderStarted = promiseWithResolvers<void>()
  const releaseRender = promiseWithResolvers<void>()

  server = await createServer({
    configFile: false,
    root,
    cacheDir,
    logLevel: 'silent',
    optimizeDeps: {
      force: true,
      entries: ['entry.js'],
      rolldownOptions: {
        plugins: [
          {
            name: 'test:hold-write',
            async renderStart() {
              renderStarted.resolve()
              await releaseRender.promise
            },
          },
        ],
      },
    },
    server: { middlewareMode: true, ws: false },
  })

  // the post-scan optimizer run is now generating its output
  await renderStarted.promise

  const closePromise = server.close()
  server = undefined
  // let the run be cancelled before the output is written
  await setTimeout(100)
  releaseRender.resolve()
  await closePromise

  // give a late write the chance to happen
  await setTimeout(500)
  const leftovers = fs.existsSync(cacheDir)
    ? fs.readdirSync(cacheDir).filter((name) => name.startsWith('deps_temp'))
    : []
  expect(leftovers).toStrictEqual([])
})
