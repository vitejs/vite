import { untilUpdated, mochaSetup, mochaReset } from '../../testUtils'

describe('wasm.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should work when inlined', async () => {
    await page.click('.inline-wasm .run')
    await untilUpdated(() => page.textContent('.inline-wasm .result'), '42')
  })

  it('should work when output', async () => {
    await page.click('.output-wasm .run')
    await untilUpdated(() => page.textContent('.output-wasm .result'), '24')
  })
})
