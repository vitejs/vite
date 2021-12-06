import { mochaSetup, mochaReset } from '../../testUtils'

describe('preserve-symlinks.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('should have no 404s', () => {
    browserLogs.forEach((msg) => {
      expect(msg).not.toMatch('404')
    })
  })

  it('not-preserve-symlinks', async () => {
    expect(await page.textContent('#root')).toBe('hello vite')
  })
})
