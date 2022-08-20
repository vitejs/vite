import { describe, expect, it } from 'vitest'
import { ModuleGraph } from '../moduleGraph'

describe('moduleGraph', () => {
  describe('invalidateModule', () => {
    it('removes an ssrError', async () => {
      const moduleGraph = new ModuleGraph(async (url) => ({ id: url }))
      const entryUrl = '/x.js'

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      entryModule.ssrError = new Error(`unable to execute module`)

      expect(entryModule.ssrError).to.be.a('error')
      moduleGraph.invalidateModule(entryModule)
      expect(entryModule.ssrError).toBe(null)
    })

    it('ensureEntryFromUrl should based on resolvedId', async () => {
      const moduleGraph = new ModuleGraph(async (url) => {
        if (url === '/xx.js') {
          return { id: '/x.js' }
        } else {
          return { id: url }
        }
      })
      const meta = { vite: 'test' }

      const mod1 = await moduleGraph.ensureEntryFromUrl('/x.js', false)
      mod1.meta = meta
      const mod2 = await moduleGraph.ensureEntryFromUrl('/xx.js', false)
      expect(mod2.meta).to.equal(meta)
    })
  })
})
