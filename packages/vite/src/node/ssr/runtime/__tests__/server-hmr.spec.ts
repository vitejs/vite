import { describe, expect } from 'vitest'
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
  },
  process.env.CI ? 50_00 : 5_000,
)
