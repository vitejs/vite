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
  })

  describe('onFileDelete', () => {
    it('removes module from all maps and breaks circular references', async () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      const mod = await moduleGraph.ensureEntryFromUrl('/test.js', false)
      moduleGraph.updateModuleTransformResult(mod, {
        code: 'export default "test"',
        map: null,
        etag: 'W/"test-etag"',
      })

      // Verify module is registered in all maps
      expect(moduleGraph.urlToModuleMap.get('/test.js')).toBe(mod)
      expect(moduleGraph.idToModuleMap.get('/test.js')).toBe(mod)
      expect(moduleGraph.fileToModulesMap.get('/test.js')).toContain(mod)
      expect(moduleGraph.etagToModuleMap.get('W/"test-etag"')).toBe(mod)

      // Add an imported module to verify circular reference cleanup
      const dep = await moduleGraph.ensureEntryFromUrl('/dep.js', false)
      mod.importedModules.add(dep)
      dep.importers.add(mod)

      moduleGraph.onFileDelete('/test.js')

      // Module should be removed from all maps
      expect(moduleGraph.urlToModuleMap.has('/test.js')).toBe(false)
      expect(moduleGraph.idToModuleMap.has('/test.js')).toBe(false)
      expect(moduleGraph.fileToModulesMap.has('/test.js')).toBe(false)
      expect(moduleGraph.etagToModuleMap.has('W/"test-etag"')).toBe(false)

      // Circular references should be broken
      expect(mod.importedModules.size).toBe(0)
      expect(dep.importers.has(mod)).toBe(false)
    })

    it('re-creates a fresh module when the file is re-created after deletion', async () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      const mod1 = await moduleGraph.ensureEntryFromUrl('/test.js', false)
      moduleGraph.updateModuleTransformResult(mod1, {
        code: 'export default "v1"',
        map: null,
        etag: 'W/"v1"',
      })

      moduleGraph.onFileDelete('/test.js')

      // Re-creating the file should produce a new module node, not reuse the
      // stale one (which would keep the old transformResult)
      const mod2 = await moduleGraph.ensureEntryFromUrl('/test.js', false)
      expect(mod2).not.toBe(mod1)
      expect(mod2.transformResult).toBe(null)
      expect(moduleGraph.urlToModuleMap.get('/test.js')).toBe(mod2)
      expect(moduleGraph.idToModuleMap.get('/test.js')).toBe(mod2)
    })

    it('removes deleted module from importers importedModules sets', async () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      const importer = await moduleGraph.ensureEntryFromUrl('/main.js', false)
      const dep = await moduleGraph.ensureEntryFromUrl('/dep.js', false)
      importer.importedModules.add(dep)
      dep.importers.add(importer)

      moduleGraph.onFileDelete('/dep.js')

      // The importer should no longer retain the deleted module
      expect(importer.importedModules.has(dep)).toBe(false)
      // The deleted module's own sets should also be cleared
      expect(dep.importers.has(importer)).toBe(false)
    })
  })
})
