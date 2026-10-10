import { describe, expect, it } from 'vitest'
import type { ModuleNode } from '../mixedModuleGraph'
import { ModuleGraph } from '../mixedModuleGraph'
import { EnvironmentModuleGraph } from '../moduleGraph'

describe('moduleGraph', () => {
  describe('invalidateModule', () => {
    it('removes an ssr error', async () => {
      const moduleGraph = new EnvironmentModuleGraph('ssr', async (url) => ({
        id: url,
      }))
      const entryUrl = '/x.js'

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      entryModule.ssrError = new Error(`unable to execute module`)

      expect(entryModule.ssrError).to.be.a('error')
      moduleGraph.invalidateModule(entryModule)
      expect(entryModule.ssrError).toBe(null)
    })

    it('ensureEntryFromUrl should based on resolvedId', async () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => {
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

    it('ensure backward compatibility', async () => {
      const clientModuleGraph = new EnvironmentModuleGraph(
        'client',
        async (url) => ({ id: url }),
      )
      const ssrModuleGraph = new EnvironmentModuleGraph('ssr', async (url) => ({
        id: url,
      }))
      const moduleGraph = new ModuleGraph({
        client: () => clientModuleGraph,
        ssr: () => ssrModuleGraph,
      })

      const addBrowserModule = (url: string) =>
        clientModuleGraph.ensureEntryFromUrl(url)
      const getBrowserModule = (url: string) =>
        clientModuleGraph.getModuleById(url)

      const addServerModule = (url: string) =>
        ssrModuleGraph.ensureEntryFromUrl(url)
      const getServerModule = (url: string) => ssrModuleGraph.getModuleById(url)

      const clientModule1 = await addBrowserModule('/1.js')
      const ssrModule1 = await addServerModule('/1.js')
      const module1 = moduleGraph.getModuleById('/1.js')!
      expect(module1._clientModule).toBe(clientModule1)
      expect(module1._ssrModule).toBe(ssrModule1)

      const module2b = await moduleGraph.ensureEntryFromUrl('/b/2.js')
      const module2s = await moduleGraph.ensureEntryFromUrl('/s/2.js')
      expect(module2b._clientModule).toBe(getBrowserModule('/b/2.js'))
      expect(module2s._ssrModule).toBe(getServerModule('/s/2.js'))

      const importersUrls = ['/1/a.js', '/1/b.js', '/1/c.js']
      ;(await Promise.all(importersUrls.map(addBrowserModule))).forEach((mod) =>
        clientModule1.importers.add(mod),
      )
      ;(await Promise.all(importersUrls.map(addServerModule))).forEach((mod) =>
        ssrModule1.importers.add(mod),
      )

      expect(module1.importers.size).toBe(importersUrls.length)

      const clientModule1importersValues = [...clientModule1.importers]
      const ssrModule1importersValues = [...ssrModule1.importers]

      const module1importers = module1.importers
      const module1importersValues = [...module1importers.values()]
      expect(module1importersValues.length).toBe(importersUrls.length)
      expect(module1importersValues[1]._clientModule).toBe(
        clientModule1importersValues[1],
      )
      expect(module1importersValues[1]._ssrModule).toBe(
        ssrModule1importersValues[1],
      )

      const module1importersFromForEach: ModuleNode[] = []
      module1.importers.forEach((imp) => {
        moduleGraph.invalidateModule(imp)
        module1importersFromForEach.push(imp)
      })
      expect(module1importersFromForEach.length).toBe(importersUrls.length)
      expect(module1importersFromForEach[1]._clientModule).toBe(
        clientModule1importersValues[1],
      )
      expect(module1importersFromForEach[1]._ssrModule).toBe(
        ssrModule1importersValues[1],
      )
    })

    it('hard-invalidates importers when dependency is deleted (#23527)', async () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))
      const depMod = await moduleGraph.ensureEntryFromUrl('/dep.js', false)
      const importerMod = await moduleGraph.ensureEntryFromUrl(
        '/main.js',
        false,
      )

      depMod.importers.add(importerMod)
      importerMod.importedModules.add(depMod)
      importerMod.staticImportedUrls = new Set([depMod.url])

      importerMod.transformResult = {
        code: 'import { value } from "/dep.js";',
        map: null,
        etag: '123',
      }

      // Normal file change soft-invalidates the importer
      moduleGraph.onFileChange(depMod.file!)
      expect(importerMod.invalidationState).toEqual({
        code: 'import { value } from "/dep.js";',
        map: null,
        etag: '123',
      })
      expect(depMod.isDeleted).toBe(false)

      // Reset importer to simulate fresh transform result
      importerMod.invalidationState = undefined
      importerMod.transformResult = {
        code: 'import { value } from "/dep.js";',
        map: null,
        etag: '123',
      }

      // File deletion must hard-invalidate the importer
      moduleGraph.onFileDelete(depMod.file!)
      expect(depMod.isDeleted).toBe(true)
      expect(importerMod.invalidationState).toBe('HARD_INVALIDATED')
      expect(importerMod.transformResult).toBe(null)

      // Re-ensuring entry resets isDeleted flag
      await moduleGraph.ensureEntryFromUrl('/dep.js', false)
      expect(depMod.isDeleted).toBe(false)
    })
  })
})
