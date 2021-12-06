import { mochaReset, mochaSetup, getColor, untilUpdated } from '../../testUtils'

describe('multiple-entrypoints.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should have css applied on second dynamic import', async () => {
    await untilUpdated(() => page.textContent('.content'), 'Initial', true)
    await page.click('.b')

    await untilUpdated(() => page.textContent('.content'), 'Reference', true)
    expect(await getColor('.content')).toBe('red')
  })
})
