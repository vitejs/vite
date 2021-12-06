import { port } from './serve'
import fetch from 'node-fetch'
import { mochaReset, mochaSetup } from '../../testUtils'

const url = `http://localhost:${port}`

describe('ssr-html.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  describe('injected inline scripts', () => {
    it('no injected inline scripts are present', async () => {
      await page.goto(url)
      const inlineScripts = await page.$$eval('script', (nodes) =>
        nodes.filter((n) => !n.getAttribute('src') && n.innerHTML)
      )
      expect(inlineScripts).toHaveLength(0)
    })

    it('injected script proxied correctly', async () => {
      await page.goto(url)
      const proxiedScripts = await page.$$eval('script', (nodes) =>
        nodes
          .filter((n) => {
            const src = n.getAttribute('src')
            if (!src) return false
            return src.includes('?html-proxy&index')
          })
          .map((n) => n.getAttribute('src'))
      )

      // assert at least 1 proxied script exists
      expect(proxiedScripts).not.toHaveLength(0)

      const scriptContents = await Promise.all(
        proxiedScripts.map((src) => fetch(url + src).then((res) => res.text()))
      )

      // all proxied scripts return code
      for (const code of scriptContents) {
        expect(code).toBeTruthy()
      }
    })
  })
})
