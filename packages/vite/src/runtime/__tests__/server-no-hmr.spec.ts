import { describe, expect } from 'vitest'
import { createViteRuntimeTester } from './utils'

describe('vite-runtime hmr works as expected', async () => {
  const it = await createViteRuntimeTester({
    server: {
      // override watch options because it's disabled by default
      watch: {},
      hmr: false,
    },
  })

  it("hmr client is not defined if it's disabled", async ({ runtime }) => {
    expect(runtime.hmrClient).toBeUndefined()

    const mod = await runtime.executeUrl('/fixtures/hmr.js')
    expect(mod).toHaveProperty('hmr')
    expect(mod.hmr).toBeUndefined()
  })
})
