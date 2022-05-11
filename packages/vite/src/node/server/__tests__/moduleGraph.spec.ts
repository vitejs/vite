import { beforeEach, describe, expect, it } from 'vitest'
import { ModuleGraph } from '../moduleGraph'
let moduleGraph: ModuleGraph

describe('moduleGraph', () => {
  describe('invalidateModule', () => {
    beforeEach(() => {
      moduleGraph = new ModuleGraph((id) => Promise.resolve({ id }))
    })

    it('removes an ssrError', async () => {
      const entryUrl = '/x.js'

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      entryModule.ssrError = new Error(`unable to execute module`)

      expect(entryModule.ssrError).to.be.a('error')
      moduleGraph.invalidateModule(entryModule)
      expect(entryModule.ssrError).toBe(null)
    })
  })
})
