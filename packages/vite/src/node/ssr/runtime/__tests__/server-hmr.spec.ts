import { describe, expect, onTestFinished } from 'vitest'
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

      expect(runner.hmrClient!.hotModulesMap.size).toBe(2)
      expect(runner.hmrClient!.dataMap.size).toBe(2)
      expect(runner.hmrClient!.ctxToListenersMap.size).toBe(2)

      for (const fixture of [fixtureC, fixtureD]) {
        expect(runner.hmrClient!.hotModulesMap.has(fixture)).toBe(true)
        expect(runner.hmrClient!.dataMap.has(fixture)).toBe(true)
        expect(runner.hmrClient!.ctxToListenersMap.has(fixture)).toBe(true)
      }
    })

    it('does not expose partial exports during concurrent updates', async ({
      runner,
    }) => {
      const testGlobal = globalThis as any

      testGlobal.__vite_ssr_hmr_reexport_race__ = {
        wait: () => Promise.resolve(),
      }
      onTestFinished(() => {
        delete testGlobal.__vite_ssr_hmr_reexport_race__
      })

      await runner.import('/fixtures/hmr-reexport-race/entry-a.js')
      await runner.import('/fixtures/hmr-reexport-race/entry-b.js')

      const sharedModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-reexport-race/shared.js',
      )
      const coreModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-reexport-race/core.js',
      )
      const entryAModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-reexport-race/entry-a.js',
      )
      const entryBModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-reexport-race/entry-b.js',
      )
      expect(sharedModule).toBeDefined()
      expect(coreModule).toBeDefined()
      expect(entryAModule).toBeDefined()
      expect(entryBModule).toBeDefined()

      let waitStarted!: () => void
      const waitStartedPromise = new Promise<void>((resolve) => {
        waitStarted = resolve
      })
      let releaseWait!: () => void
      const waitPromise = new Promise<void>((resolve) => {
        releaseWait = resolve
      })

      testGlobal.__vite_ssr_hmr_reexport_race__ = {
        wait: () => {
          waitStarted()
          return waitPromise
        },
      }

      for (const module of [
        entryAModule!,
        entryBModule!,
        sharedModule!,
        coreModule!,
      ]) {
        runner.evaluatedModules.invalidateModule(module)
      }

      const importA = runner.import('/fixtures/hmr-reexport-race/entry-a.js')
      await waitStartedPromise

      const importB = runner.import('/fixtures/hmr-reexport-race/entry-b.js')
      // Wait deterministically until entry-b has reached the point where it
      // observes shared as in-flight. The `mod.imports.add(depMod.id)` line
      // in `request()` runs synchronously immediately before `cachedRequest`
      // executes its cycle-detection prefix, so observing this edge means
      // the buggy/fixed branch has either just run or is about to run on
      // the same microtask. `imports` is cleared by invalidateModule, so
      // this is a fresh signal (unlike `importers`, which is preserved).
      const entryBNode = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-reexport-race/entry-b.js',
      )!
      while (!entryBNode.imports.has(sharedModule!.id)) {
        await new Promise((resolve) => setImmediate(resolve))
      }
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

      const hmrListeners = runner.hmrClient!.hotModulesMap
      expect(hmrListeners.has('/fixtures/hmr-reexport-race/entry-a.js')).toBe(
        true,
      )
      expect(hmrListeners.has('/fixtures/hmr-reexport-race/entry-b.js')).toBe(
        true,
      )
    })

    it('does not expose partial exports across a stale importers triangle', async ({
      runner,
    }) => {
      const testGlobal = globalThis as any

      // Default the wait hook to a no-op so the warmup pass completes.
      testGlobal.__vite_ssr_hmr_graph_cycle__ = {
        wait: () => Promise.resolve(),
      }
      onTestFinished(() => {
        delete testGlobal.__vite_ssr_hmr_graph_cycle__
      })

      // Warmup: evaluate the t -> u -> v -> t triangle so the persisted
      // importers graph contains the cycle.
      await runner.import('/fixtures/hmr-graph-cycle/t.js')

      const tModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-graph-cycle/t.js',
      )!
      const uModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-graph-cycle/u.js',
      )!
      const vModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-graph-cycle/v.js',
      )!
      const stallModule = runner.evaluatedModules.getModuleByUrl(
        '/fixtures/hmr-graph-cycle/stall.js',
      )!

      // Sanity check: the importers graph contains the t <- v <- u <- t cycle
      // that the buggy graph-only check used to walk. invalidateModule
      // intentionally does not clear `importers`, so this cycle survives the
      // invalidation below and is what makes the regression possible.
      expect(tModule.importers.has(vModule.id)).toBe(true)
      expect(vModule.importers.has(uModule.id)).toBe(true)
      expect(uModule.importers.has(tModule.id)).toBe(true)

      // Install a controllable wait so t parks mid-eval inside stall.js
      // exactly when entry-b reaches cachedRequest(t.js).
      let waitStarted!: () => void
      const waitStartedPromise = new Promise<void>((resolve) => {
        waitStarted = resolve
      })
      let releaseWait!: () => void
      const waitPromise = new Promise<void>((resolve) => {
        releaseWait = resolve
      })

      testGlobal.__vite_ssr_hmr_graph_cycle__ = {
        wait: () => {
          waitStarted()
          return waitPromise
        },
      }

      for (const module of [tModule, uModule, vModule, stallModule]) {
        runner.evaluatedModules.invalidateModule(module)
      }

      const importA = runner.import('/fixtures/hmr-graph-cycle/entry-a.js')
      await waitStartedPromise

      const importB = runner.import('/fixtures/hmr-graph-cycle/entry-b.js')
      // Wait deterministically until entry-b has reached the point where it
      // observes t as in-flight. `imports` is cleared by invalidateModule, so
      // observing this edge means entry-b is racing the cycle-detection
      // prefix of cachedRequest(t.js) on the same microtask boundary the bug
      // fires on. (See the matching pattern in the re-export race test above.)
      while (true) {
        const entryBNode = runner.evaluatedModules.getModuleByUrl(
          '/fixtures/hmr-graph-cycle/entry-b.js',
        )
        if (entryBNode?.imports.has(tModule.id)) break
        await new Promise((resolve) => setImmediate(resolve))
      }
      releaseWait()
      const results = await Promise.allSettled([importA, importB] as const)

      expect(results).toEqual([
        {
          status: 'fulfilled',
          value: expect.objectContaining({ seen: 1 }),
        },
        {
          status: 'fulfilled',
          value: expect.objectContaining({ seen: 1 }),
        },
      ])
    })
  },
  process.env.CI ? 50_00 : 5_000,
)
