import path from 'node:path'
import { type Plugin, type ViteDevServer, createServer } from 'vite'
import { afterEach, describe, expect, test } from 'vitest'
import { isServe } from '~utils'

let server: ViteDevServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
})

// In full bundle mode the build is driven by Rolldown's dev engine, which is the
// one that invokes plugins' `buildStart`/`buildEnd` hooks. Regression test for
// `buildEnd` being called twice because both `bundledDev.close()` and
// `pluginContainer.close()` fired it on server close.
describe.runIf(isServe)('full bundle mode build hooks', () => {
  test('buildStart and buildEnd are each called only once', async () => {
    let buildStartCount = 0
    let buildEndCount = 0
    const countPlugin: Plugin = {
      name: 'count-build-hooks',
      buildStart() {
        buildStartCount++
      },
      buildEnd() {
        buildEndCount++
      },
    }

    server = await createServer({
      root: path.resolve(import.meta.dirname, '..'),
      configFile: false,
      logLevel: 'silent',
      experimental: { bundledDev: true },
      plugins: [countPlugin],
    })
    await server.listen()

    // the initial full-bundle build runs on listen and fires buildStart + buildEnd once
    await expect.poll(() => buildEndCount, { timeout: 10000 }).toBe(1)
    expect(buildStartCount).toBe(1)

    await server.close()
    server = undefined

    // closing must not fire buildStart/buildEnd again
    expect(buildStartCount).toBe(1)
    expect(buildEndCount).toBe(1)
  })
})
