import { describe, expect } from 'vitest'
import { createModuleRunnerTester } from './utils'

describe('vite-runtime hmr works as expected', async () => {
  const it = await createModuleRunnerTester({
    server: {
      // override watch options because it's disabled by default
      watch: {},
      hmr: false,
    },
  })

  it("hmr client is not defined if it's disabled", async ({
    runner: runtime,
  }) => {
    expect(runtime.hmrClient).toBeUndefined()

    const mod = await runtime.import('/fixtures/hmr.js')
    expect(mod).toHaveProperty('hmr')
    expect(mod.hmr).toBeUndefined()
  })
})
