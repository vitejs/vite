import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { assert, expect, test } from 'vitest'
import { createServer } from '../..'
import { promiseWithResolvers } from '../../../shared/utils'

test.each([false, true])(
  'settles pending dependency loads on close (optimization in flight: %s)',
  async (inFlight) => {
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-optimizer-close-'),
    )
    const dependencies = ['first-dep', 'second-dep'].map((name) => {
      const directory = path.join(root, 'node_modules', name)
      fs.mkdirSync(directory, { recursive: true })
      fs.writeFileSync(
        path.join(directory, 'package.json'),
        JSON.stringify({ name, type: 'module', main: 'index.js' }),
      )
      const file = path.join(directory, 'index.js')
      fs.writeFileSync(file, `export default ${JSON.stringify(name)}`)
      return { name, file }
    })
    const bundleStarted = promiseWithResolvers<void>()
    const releaseBundle = promiseWithResolvers<void>()
    const bundleClosed = promiseWithResolvers<void>()
    const server = await createServer({
      configFile: false,
      root,
      cacheDir: path.join(root, '.vite'),
      logLevel: 'silent',
      server: { ws: false },
      optimizeDeps: {
        rolldownOptions: {
          plugins: [
            {
              name: 'test:block-optimization',
              async buildStart() {
                bundleStarted.resolve()
                await releaseBundle.promise
              },
              closeBundle() {
                bundleClosed.resolve()
              },
            },
          ],
        },
      },
    })
    const environment = server.environments.client
    const optimizer = environment.depsOptimizer
    assert(optimizer)

    try {
      const [first, second] = dependencies
      const firstInfo = optimizer.registerMissingImport(first.name, first.file)
      if (inFlight) {
        optimizer.run()
        await bundleStarted.promise
      }
      // Once the run has started, the first dependency belongs to the queued
      // batch and the second belongs to the current, not-yet-optimized batch.
      const secondInfo = optimizer.registerMissingImport(
        second.name,
        second.file,
      )
      expect(firstInfo.processing === secondInfo.processing).toBe(!inFlight)

      let settled = 0
      const processing = Promise.all(
        [firstInfo, secondInfo].map((info) => {
          assert(info.processing)
          return info.processing.then(() => settled++)
        }),
      )
      const loads = Promise.allSettled(
        [firstInfo, secondInfo].map((info) =>
          environment.pluginContainer.load(optimizer.getOptimizedDepId(info)),
        ),
      )
      await Promise.resolve()
      expect(settled).toBe(0)

      const closing = server.close()
      // Shutdown must release both batches without waiting for the blocked
      // bundle to finish. Polling bounds failure; the gates establish the race.
      await expect.poll(() => settled).toBe(2)
      await processing
      expect(await loads).toEqual([
        expect.objectContaining({ status: 'rejected' }),
        expect.objectContaining({ status: 'rejected' }),
      ])
      await closing
    } finally {
      releaseBundle.resolve()
      // Also drain the promises on the unfixed implementation so a regression
      // reports an assertion failure instead of hanging the test runner itself.
      await optimizer.close()
      optimizer.run()
      await server.close()
      if (inFlight) await bundleClosed.promise
      fs.rmSync(root, { recursive: true, force: true })
    }
  },
)
