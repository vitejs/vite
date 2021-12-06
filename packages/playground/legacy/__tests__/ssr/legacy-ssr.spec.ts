import { isBuild, mochaReset, mochaSetup } from '../../../testUtils'
import { port } from './serve'

const url = `http://localhost:${port}`

describe('legacy-ssr.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  if (isBuild) {
    it('should work', async () => {
      await page.goto(url)
      expect(await page.textContent('#app')).toMatch('Hello')
    })

    it('import.meta.env.LEGACY', async () => {
      // SSR build is always modern
      expect(await page.textContent('#env')).toMatch('false')
    })
  } else {
    // this test doesn't support serve mode
    // must contain at least one test
    it('should work', () => void 0)
  }
})
