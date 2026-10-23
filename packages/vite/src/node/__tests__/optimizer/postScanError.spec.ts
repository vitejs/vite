import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createLogger, createServer } from '../..'
import { promiseWithResolvers } from '../../../shared/utils'

let server: ViteDevServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
})

// The first optimize run after the scan is awaited in `onCrawlEnd`, outside of
// the error handling in `runOptimizer`. A failure there used to be an unhandled
// rejection that crashed the dev server.
test.for([true, false])(
  'does not crash when the post-scan optimize run fails (holdUntilCrawlEnd: %s)',
  async (holdUntilCrawlEnd) => {
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason)
    }
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      const errorLogged = promiseWithResolvers<void>()
      const logger = createLogger('error')
      logger.error = (msg) => {
        if (String(msg).includes('error while updating dependencies')) {
          errorLogged.resolve()
        }
      }

      server = await createServer({
        configFile: false,
        customLogger: logger,
        root: path.join(
          import.meta.dirname,
          '../fixtures/optimizer-post-scan-error',
        ),
        // keep the cache inside the fixture so that other specs are not affected
        cacheDir: 'node_modules/.vite',
        server: { ws: false },
        optimizeDeps: {
          force: true,
          holdUntilCrawlEnd,
          rolldownOptions: {
            plugins: [
              {
                name: 'test:fail-optimize',
                // only fail the bundling, not the scan
                renderStart() {
                  throw new Error('test: optimize failure')
                },
              },
            ],
          },
        },
      })
      await server.listen(0)

      const client = server.environments.client
      await client.transformRequest('/entry.js')
      await client.waitForRequestsIdle()

      const logged = await Promise.race([
        errorLogged.promise.then(() => true),
        setTimeout(5000, false),
      ])
      // let pending rejections surface
      await setTimeout(50)

      expect(logged).toBe(true)
      expect(unhandledRejections).toStrictEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  },
)
