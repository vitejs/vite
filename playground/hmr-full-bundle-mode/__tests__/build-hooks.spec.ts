import path from 'node:path'
import { type InlineConfig, type Plugin, createServer } from 'vite'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
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
  test.each(['ready', 'rebuilding', 'failed', 'fails-during-wait'] as const)(
    'recovers a late fallback page when the bundle is %s',
    async (bundleState) => {
      let buildCount = 0
      let failRebuild =
        bundleState === 'failed' || bundleState === 'fails-during-wait'
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
            buildStart: {
              order: 'pre',
              async handler() {
                buildCount++
                if (buildCount === 1) {
                  await buildGate
                } else {
                  await rebuildGate
                  if (failRebuild) {
                    throw new Error('test rebuild failed')
                  }
                }
              },
            },
            generateBundle(_options, bundle) {
              for (const output of Object.values(bundle)) {
                if (output.type === 'chunk' && output.isEntry) {
                  output.code = `document.documentElement.dataset.testBuild = '${buildCount}';\n${output.code}`
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
      void lateNavigation.catch(() => {})
      await fallbackResponse
      await expect.poll(() => server.ws.clients.size).toBe(1)

      releaseBuild()
      await expect
        .poll(() => firstPage.textContent('h1'))
        .toBe('HMR Full Bundle Mode')
      await expect
        .poll(() => firstPage.getAttribute('html', 'data-test-build'))
        .toBe('1')
      await firstPage.evaluate(() => {
        document.body.dataset.keepAlive = 'yes'
      })

      const engine = server.environments.client.bundledDev!['devEngine']

      if (bundleState !== 'ready') {
        engine.triggerFullBuild()
        await expect.poll(() => buildCount).toBe(2)
        if (bundleState === 'failed') {
          releaseRebuild()
          await expect
            .poll(() => firstPage.isVisible('vite-error-overlay'))
            .toBe(true)
        }
      }

      const reloadMessages: string[] = []
      let navigations = 0
      latePage.on('framenavigated', (frame) => {
        if (frame === latePage.mainFrame()) navigations++
      })
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
      const stateChecks = vi.spyOn(engine, 'getBundleState')
      onTestFinished(() => stateChecks.mockRestore())
      releaseFallback()
      await lateNavigation

      if (bundleState === 'rebuilding' || bundleState === 'fails-during-wait') {
        await expect
          .poll(() => stateChecks.mock.results.length)
          .toBeGreaterThan(0)
        await Promise.all(
          stateChecks.mock.results.map((result) =>
            result.type === 'return' ? result.value : undefined,
          ),
        )
        expect(reloadMessages).toEqual([])
        expect(navigations).toBe(1)
        expect(await latePage.textContent('h1')).toBe('Bundling in progress')
        releaseRebuild()
      }
      if (bundleState === 'failed' || bundleState === 'fails-during-wait') {
        await expect
          .poll(() => latePage.isVisible('vite-error-overlay'))
          .toBe(true)
        expect(reloadMessages).toEqual([])
        expect(navigations).toBe(1)
        failRebuild = false
        engine.triggerFullBuild()
      }
      await expect
        .poll(() => latePage.textContent('h1'))
        .toBe('HMR Full Bundle Mode')
      const expectedBuild =
        bundleState === 'ready' ? '1' : bundleState === 'rebuilding' ? '2' : '3'
      await expect
        .poll(() => latePage.getAttribute('html', 'data-test-build'))
        .toBe(expectedBuild)
      expect(navigations).toBe(2)
      expect(await firstPage.getAttribute('body', 'data-keep-alive')).toBe(
        'yes',
      )
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
