import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { afterEach, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createLogger, createServer } from '../..'

let server: ViteDevServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
})

// When the initial scan fails, the optimizer enters the processing state
// before the scan and there is no scan result to release. A dep discovered
// afterwards must still be optimized, otherwise requests for it never resolve.
test.for([true, false])(
  'optimizes deps discovered after a failed scan (holdUntilCrawlEnd: %s)',
  async (holdUntilCrawlEnd) => {
    const logger = createLogger('error')
    logger.error = () => {}

    server = await createServer({
      configFile: false,
      customLogger: logger,
      root: path.join(
        import.meta.dirname,
        '../fixtures/optimizer-scan-failure',
      ),
      // keep the cache inside the fixture so that other specs are not affected
      cacheDir: 'node_modules/.vite',
      server: { ws: false },
      optimizeDeps: {
        force: true,
        holdUntilCrawlEnd,
      },
    })
    await server.listen(0)

    const client = server.environments.client
    // the entry imports a package that does not exist, which fails the scan
    await client.transformRequest('/entry.js').catch(() => {})
    await client.waitForRequestsIdle()

    // `page.js` imports a dep that is only found while crawling
    const result = await client.transformRequest('/page.js')
    const dep = client.depsOptimizer!.metadata.discovered.vue
    expect(result?.code).toContain('/node_modules/.vite/deps/vue.js')

    const processed = await Promise.race([
      dep.processing!.then(() => true),
      setTimeout(5000, false),
    ])
    expect(processed).toBe(true)
  },
)
