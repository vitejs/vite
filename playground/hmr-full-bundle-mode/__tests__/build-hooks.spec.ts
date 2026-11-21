import path from 'node:path'
import { type InlineConfig, type Plugin, createServer } from 'vite'
import { describe, expect, onTestFinished, test } from 'vitest'
import { isServe } from '~utils'

async function createTestServer(config: InlineConfig) {
  const server = await createServer(config)
  onTestFinished(() => server.close())
  return server
}

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

    const server = await createTestServer({
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

    // closing must not fire buildStart/buildEnd again
    expect(buildStartCount).toBe(1)
    expect(buildEndCount).toBe(1)
  })
})
