import path from 'node:path'
import { type InlineConfig, type Plugin, createServer } from 'vite'
import { describe, expect, onTestFinished, test } from 'vitest'
import { browser, isServe } from '~utils'

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
  test.each(['ready', 'rebuilding', 'failed'] as const)(
    'recovers a late fallback page when the bundle is %s',
    async (bundleState) => {
      let buildCount = 0
      let releaseBuild!: () => void
      const buildGate = new Promise<void>((resolve) => {
        releaseBuild = resolve
      })
      let releaseFallback!: () => void
      const fallbackGate = new Promise<void>((resolve) => {
        releaseFallback = resolve
      })
      let fallbackReceived!: () => void
      const fallbackResponse = new Promise<void>((resolve) => {
        fallbackReceived = resolve
      })
      let releaseRebuild!: () => void
      const rebuildGate = new Promise<void>((resolve) => {
        releaseRebuild = resolve
      })

      const server = await createTestServer({
        root: path.resolve(import.meta.dirname, '..'),
        configFile: false,
        logLevel: 'silent',
        experimental: { bundledDev: true },
        server: { port: 0 },
        plugins: [
          {
            name: 'hold-build',
            async buildStart() {
              buildCount++
              if (buildCount === 1) {
                await buildGate
              } else {
                await rebuildGate
                if (bundleState === 'failed') {
                  throw new Error('test rebuild failed')
                }
              }
            },
          },
        ],
      })
      onTestFinished(() => {
        releaseBuild()
        releaseFallback()
        releaseRebuild()
      })
      await server.listen()
      const url = server.resolvedUrls!.local[0]
      const firstPage = await browser.newPage()
      const latePage = await browser.newPage()
      await latePage.context().grantPermissions(['local-network-access'])
      onTestFinished(async () => {
        await firstPage.close()
        await latePage.close()
      })

      let holdFallback = true
      await latePage.route('**/*', async (route) => {
        if (holdFallback && route.request().isNavigationRequest()) {
          holdFallback = false
          const response = await route.fetch()
          expect(await response.text()).toContain('Bundling in progress')
          fallbackReceived()
          await fallbackGate
          await route.fulfill({ response })
        } else {
          await route.continue()
        }
      })

      await firstPage.goto(url)
      const lateNavigation = latePage.goto(url)
      await fallbackResponse
      await expect.poll(() => server.ws.clients.size).toBe(1)

      releaseBuild()
      await expect
        .poll(() => firstPage.textContent('h1'))
        .toBe('HMR Full Bundle Mode')

      if (bundleState !== 'ready') {
        server.environments.client.bundledDev!['devEngine'].triggerFullBuild()
        await expect.poll(() => buildCount).toBe(2)
        if (bundleState === 'failed') {
          releaseRebuild()
          await expect
            .poll(() => firstPage.isVisible('vite-error-overlay'))
            .toBe(true)
        }
      }

      const reloadMessages: string[] = []
      latePage.on('websocket', (socket) => {
        socket.on('framereceived', ({ payload }) => {
          if (
            typeof payload === 'string' &&
            JSON.parse(payload).type === 'full-reload'
          ) {
            reloadMessages.push(payload)
          }
        })
      })
      releaseFallback()
      await lateNavigation
      if (bundleState === 'failed') {
        await expect
          .poll(() => latePage.isVisible('vite-error-overlay'))
          .toBe(true)
        expect(reloadMessages).toEqual([])
        return
      }
      if (bundleState === 'rebuilding') {
        await expect.poll(() => server.ws.clients.size).toBe(2)
        releaseRebuild()
      }
      await expect
        .poll(() => latePage.textContent('h1'))
        .toBe('HMR Full Bundle Mode')
    },
  )

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
