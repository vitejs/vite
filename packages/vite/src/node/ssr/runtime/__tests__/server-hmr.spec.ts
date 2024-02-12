import { describe, expect } from 'vitest'
import { createViteRuntimeTester } from './utils'

describe(
  'vite-runtime hmr works as expected',
  async () => {
    const it = await createViteRuntimeTester({
      server: {
        // override watch options because it's disabled by default
        watch: {},
      },
    })

    it('hmr options are defined', async ({ runtime }) => {
      expect(runtime.hmrClient).toBeDefined()

      const mod = await runtime.executeUrl('/fixtures/hmr.js')
      expect(mod).toHaveProperty('hmr')
      expect(mod.hmr).toHaveProperty('accept')
    })

    it('correctly populates hmr client', async ({ runtime }) => {
      const mod = await runtime.executeUrl('/fixtures/d')
      expect(mod.d).toBe('a')

      const fixtureC = '/fixtures/c.ts'
      const fixtureD = '/fixtures/d.ts'

      expect(runtime.hmrClient!.hotModulesMap.size).toBe(2)
      expect(runtime.hmrClient!.dataMap.size).toBe(2)
      expect(runtime.hmrClient!.ctxToListenersMap.size).toBe(2)

      for (const fixture of [fixtureC, fixtureD]) {
        expect(runtime.hmrClient!.hotModulesMap.has(fixture)).toBe(true)
        expect(runtime.hmrClient!.dataMap.has(fixture)).toBe(true)
        expect(runtime.hmrClient!.ctxToListenersMap.has(fixture)).toBe(true)
      }
    })
  },
  process.env.CI ? 50_00 : 5_000,
)
