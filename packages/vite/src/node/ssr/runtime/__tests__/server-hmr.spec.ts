import { assert, describe, expect, onTestFinished, vi } from 'vitest'
import { promiseWithResolvers } from '../../../../shared/utils'
import { createModuleRunnerTester } from './utils'

describe(
  'module runner hmr works as expected',
  async () => {
    const it = await createModuleRunnerTester({
      server: {
        // override watch options because it's disabled by default
        watch: {},
      },
    })

    it('hmr options are defined', async ({ runner }) => {
      expect(runner.hmrClient).toBeDefined()

      const mod = await runner.import('/fixtures/hmr.js')
      expect(mod).toHaveProperty('hmr')
      expect(mod.hmr).toHaveProperty('accept')
    })

    it('correctly populates hmr client', async ({ runner }) => {
      const mod = await runner.import('/fixtures/d')
      expect(mod.d).toBe('a')

      const fixtureC = '/fixtures/c.ts'
      const fixtureD = '/fixtures/d.ts'

      assert(runner.hmrClient)
      expect(runner.hmrClient.hotModulesMap.size).toBe(2)
      expect(runner.hmrClient.dataMap.size).toBe(2)
      expect(runner.hmrClient.ctxToListenersMap.size).toBe(2)

      for (const fixture of [fixtureC, fixtureD]) {
        expect(runner.hmrClient.hotModulesMap.has(fixture)).toBe(true)
        expect(runner.hmrClient.dataMap.has(fixture)).toBe(true)
        expect(runner.hmrClient.ctxToListenersMap.has(fixture)).toBe(true)
      }
    })

    it('does not expose partial exports during concurrent updates', async ({
      runner,
    }) => {
      const testGlobal = globalThis as any
      const sharedUrl = '/fixtures/hmr-reexport-race/shared.js'
      const coreUrl = '/fixtures/hmr-reexport-race/core.js'
      const entryAUrl = '/fixtures/hmr-reexport-race/entry-a.js'
      const entryBUrl = '/fixtures/hmr-reexport-race/entry-b.js'

      testGlobal.__vite_ssr_hmr_reexport_race__ = {
        wait: () => Promise.resolve(),
      }
      onTestFinished(() => {
        delete testGlobal.__vite_ssr_hmr_reexport_race__
      })

      await runner.import(entryAUrl)
      await runner.import(entryBUrl)

      const sharedModule = runner.evaluatedModules.getModuleByUrl(sharedUrl)
      const coreModule = runner.evaluatedModules.getModuleByUrl(coreUrl)
      const entryAModule = runner.evaluatedModules.getModuleByUrl(entryAUrl)
      const entryBModule = runner.evaluatedModules.getModuleByUrl(entryBUrl)
      assert(sharedModule)
      assert(coreModule)
      assert(entryAModule)
      assert(entryBModule)

      const { promise: waitStartedPromise, resolve: waitStarted } =
        promiseWithResolvers<void>()
      const { promise: waitPromise, resolve: releaseWait } =
        promiseWithResolvers<void>()

      testGlobal.__vite_ssr_hmr_reexport_race__ = {
        wait: () => {
          waitStarted()
          return waitPromise
        },
      }

      for (const module of [
        entryAModule,
        entryBModule,
        sharedModule,
        coreModule,
      ]) {
        runner.evaluatedModules.invalidateModule(module)
      }

      const importA = runner.import(entryAUrl)
      await waitStartedPromise

      const importB = runner.import(entryBUrl)
      // Wait deterministically until entry-b has reached the point where it
      // observes shared as in-flight. The `mod.imports.add(depMod.id)` line
      // in `request()` runs synchronously immediately before `cachedRequest`
      // executes its cycle-detection prefix, so observing this edge means
      // the buggy/fixed branch has either just run or is about to run on
      // the same microtask. `imports` is cleared by invalidateModule, so
      // this is a fresh signal (unlike `importers`, which is preserved).
      await vi.waitUntil(() => entryBModule.imports.has(sharedModule.id))
      releaseWait()
      const results = await Promise.allSettled([importA, importB] as const)

      expect(results).toEqual([
        {
          status: 'fulfilled',
          value: expect.objectContaining({ result: 'a' }),
        },
        {
          status: 'fulfilled',
          value: expect.objectContaining({ result: 'b' }),
        },
      ])

      assert(runner.hmrClient)
      const hmrListeners = runner.hmrClient.hotModulesMap
      expect(hmrListeners.has(entryAUrl)).toBe(true)
      expect(hmrListeners.has(entryBUrl)).toBe(true)
    })

    it('does not treat evaluated imports as live circular requests', async ({
      runner,
    }) => {
      const testGlobal = globalThis as any
      const sharedUrl = '/fixtures/hmr-evaluated-import-race/shared.js'
      const evaluatedUrl = '/fixtures/hmr-evaluated-import-race/evaluated.js'

      testGlobal.__vite_ssr_hmr_evaluated_import_race__ = {
        wait: () => Promise.resolve(),
        importShared: () => false,
      }
      onTestFinished(() => {
        delete testGlobal.__vite_ssr_hmr_evaluated_import_race__
      })

      await runner.import(sharedUrl)

      const sharedModule = runner.evaluatedModules.getModuleByUrl(sharedUrl)
      const evaluatedModule =
        runner.evaluatedModules.getModuleByUrl(evaluatedUrl)
      assert(sharedModule)
      assert(evaluatedModule)

      const { promise: waitStartedPromise, resolve: waitStarted } =
        promiseWithResolvers<void>()
      const { promise: waitPromise, resolve: releaseWait } =
        promiseWithResolvers<void>()
      const {
        promise: evaluatedWaitStartedPromise,
        resolve: evaluatedWaitStarted,
      } = promiseWithResolvers<void>()
      const { promise: evaluatedWaitPromise, resolve: releaseEvaluatedWait } =
        promiseWithResolvers<void>()

      let evaluatedRequestCount = 0
      testGlobal.__vite_ssr_hmr_evaluated_import_race__ = {
        wait: () => {
          waitStarted()
          return waitPromise
        },
        importShared: async () => {
          if (evaluatedRequestCount++ === 0) {
            evaluatedWaitStarted()
            await evaluatedWaitPromise
            return true
          }
          return false
        },
      }

      runner.evaluatedModules.invalidateModule(sharedModule)

      const sharedRequest = runner.import(sharedUrl)
      await waitStartedPromise
      expect(sharedModule.imports.has(evaluatedModule.id)).toBe(true)

      // Start an evaluation that pauses before dynamically importing shared.
      runner.evaluatedModules.invalidateModule(evaluatedModule)

      let staleEvaluatedRequestSettled = false
      const staleEvaluatedRequest = runner
        .import(evaluatedUrl)
        .then((result) => {
          staleEvaluatedRequestSettled = true
          return result
        })
      await evaluatedWaitStartedPromise

      // Simulate HMR restarting evaluated while the older evaluation is still
      // paused. The newer evaluation completes without importing shared.
      runner.evaluatedModules.invalidateModule(evaluatedModule)
      await runner.import(evaluatedUrl)
      expect(evaluatedModule.evaluated).toBe(true)

      releaseEvaluatedWait()
      await vi.waitUntil(() => evaluatedModule.imports.has(sharedModule.id))
      expect(staleEvaluatedRequestSettled).toBe(false)

      releaseWait()
      const [sharedResult, evaluatedResult] = await Promise.all([
        sharedRequest,
        staleEvaluatedRequest,
      ])
      expect(sharedResult.value).toBe('ready')
      expect(evaluatedResult.sharedValue).toBe('ready')
    })
  },
  process.env.CI ? 50_00 : 5_000,
)
