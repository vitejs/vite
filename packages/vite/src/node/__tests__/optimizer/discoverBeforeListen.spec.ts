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

// regression test for https://github.com/vitejs/vite/issues/22847
// When a module importing a bare specifier is transformed between `createServer()`
// and `server.listen()`, the dep is discovered and a debounced optimizer run starts
// before `depsOptimizer.init()` runs. `init()` then resets the optimizer metadata
// while that run is in flight, so `commitProcessing()` reads a dep from the run
// result that no longer exists in the (freshly reset) metadata and crashes with
// `Cannot read properties of undefined (reading 'browserHash')`.
test('does not crash when a dep is discovered before the server starts listening', async () => {
  const errors: string[] = []
  const logger = createLogger('error')
  logger.error = (msg) => {
    errors.push(typeof msg === 'string' ? msg : String(msg))
  }

  const bundleStarted = promiseWithResolvers<void>()

  server = await createServer({
    configFile: false,
    customLogger: logger,
    root: path.join(
      import.meta.dirname,
      '../fixtures/optimizer-discover-before-listen',
    ),
    // the fixture has no package.json, so the default cacheDir would land in
    // the shared __tests__/node_modules/.vite and this test's optimizer
    // (force: true) would delete the deps of other specs running in parallel
    // (e.g. scan.spec.ts reading deps_ssr while its module runner is active)
    cacheDir: 'node_modules/.vite',
    environments: {
      ssr: {
        resolve: {
          noExternal: true,
        },
        optimizeDeps: {
          // ensure a cold cache so the optimizer takes the crawl-end path in init()
          force: true,
          noDiscovery: false,
          rolldownOptions: {
            plugins: [
              {
                name: 'test:signal-pre-bundle',
                buildStart() {
                  bundleStarted.resolve()
                },
              },
            ],
          },
        },
      },
    },
  })

  const ssr = server.environments.ssr

  // Transform a module importing a bare specifier before the server is listening.
  // This discovers the dep and, on the buggy code, schedules a debounced optimizer
  // run, all before `depsOptimizer.init()` has run (init is deferred to `listen()`).
  await ssr.transformRequest('/entry.js')

  // The bug is that discovering a dep here schedules a debounced optimizer run
  // that races with `depsOptimizer.init()` (deferred to `listen()`) resetting the
  // metadata, crashing in `commitProcessing`. The fix's guarantee is that no run
  // starts before `init()`, so assert exactly that: fail if one starts.
  const preInitRunStarted = await Promise.race([
    bundleStarted.promise.then(() => true),
    setTimeout(300, false),
  ])
  expect(preInitRunStarted).toBe(false)

  // Starting the server runs `init()`, which scans and optimizes in the
  // background. Wait for that startup work to settle so any optimizer error has
  // surfaced (this also backstops the probe above: a run that somehow starts just
  // after it would still crash here), then assert none was logged.
  await server.listen()
  await ssr.waitForRequestsIdle()
  await ssr.depsOptimizer?.scanProcessing
  expect(errors).toStrictEqual([])
})

// regression test for https://github.com/vitejs/vite/issues/23143
// If a request for a pre-init discovered dependency is pending when the server
// closes, the request waits for the dependency's processing promise. Since
// discovery before listen intentionally doesn't start an optimizer run, close()
// needs to resolve that promise so shutdown can finish.
test('does not hang when closing with a pre-init discovered dep request', async () => {
  server = await createServer({
    configFile: false,
    root: path.join(
      import.meta.dirname,
      '../fixtures/optimizer-discover-before-listen',
    ),
    cacheDir: 'node_modules/.vite',
    environments: {
      ssr: {
        resolve: {
          noExternal: true,
        },
        optimizeDeps: {
          force: true,
          noDiscovery: false,
        },
      },
    },
  })

  const ssr = server.environments.ssr
  const depsOptimizer = ssr.depsOptimizer!

  await ssr.transformRequest('/entry.js')

  const discovered = depsOptimizer.metadata.discovered.vue!
  expect(discovered.processing).toBeDefined()

  // Start a request that waits on the discovered dep's unresolved processing
  // promise. During shutdown, the request may fail because the optimized file
  // was never written, but it must not keep close() pending forever.
  const optimizedRequest = ssr
    .transformRequest(depsOptimizer.getOptimizedDepId(discovered))
    .catch(() => {})

  const closeFinished = await Promise.race([
    server.close().then(() => true),
    setTimeout(300, false),
  ])

  expect(closeFinished).toBe(true)
  server = undefined
  await optimizedRequest
})
