import { mochaReset, mochaSetup } from '../../testUtils'

describe('extensions.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should have no 404s', () => {
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  it('not contain `.mjs`', async () => {
    const appHtml = await page.content()
    expect(appHtml).toMatch('Hello Vite!')
  })
})
