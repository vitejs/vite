import { describe, expect, it } from 'vitest'
import { createServer } from 'vite'

describe('importAnalysis - query identity regression', () => {
  it('does not treat same module with different decoration queries as separate execution nodes', async () => {
    const server = await createServer({
      configFile: false,
      root: __dirname,
      logLevel: 'silent',
    })

    const mod1 = await server.moduleGraph.ensureEntryFromUrl('/a.js?t=1')
    const mod2 = await server.moduleGraph.ensureEntryFromUrl('/a.js?t=2')

    // This is the bug condition being tested
    expect(mod1).toBe(mod2)

    await server.close()
  })
})
