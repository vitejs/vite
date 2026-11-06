import { describe, expect, it } from 'vitest'
import type { ModuleNode } from '../mixedModuleGraph'
import { ModuleGraph } from '../mixedModuleGraph'
import { EnvironmentModuleGraph } from '../moduleGraph'

describe('moduleGraph', () => {
  describe('invalidateModule', () => {
    it('invalidates transforms above a self-accepting boundary without changing their HMR timestamps', async () => {
      const graph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))
      const [dep, boundary, parent, lazy] = await Promise.all(
        ['/dep.js', '/boundary.js', '/parent.js', '/lazy.js'].map((url) =>
          graph.ensureEntryFromUrl(url),
        ),
      )
      dep.importers.add(boundary)
      boundary.importers.add(parent)
      parent.importers.add(lazy)
      boundary.isSelfAccepting = true
      parent.staticImportedUrls = new Set([boundary.url])
      const transform = { code: 'import "/boundary.js"', etag: 'parent' }
      graph.updateModuleTransformResult(parent, transform)
      parent.lastHMRTimestamp = 1
      parent.lastHMRInvalidationReceived = true

      graph.invalidateModule(dep, new Set(), 2, true)

      expect(dep.lastHMRTimestamp).toBe(2)
      expect(boundary.lastHMRTimestamp).toBe(2)
      expect(parent.lastHMRTimestamp).toBe(1)
      expect(lazy.lastHMRTimestamp).toBe(0)
      expect(parent.lastHMRInvalidationReceived).toBe(true)
      expect(parent.lastInvalidationTimestamp).toBe(2)
      expect(parent.transformResult).toBeNull()
      expect(parent.invalidationState).toBe(transform)
      expect(graph.etagToModuleMap.has(transform.etag)).toBe(false)
      expect(lazy.invalidationState).toBe('HARD_INVALIDATED')
    })

    it.each([
      [true, true],
      [false, true],
      [true, false],
      [false, false],
    ])(
      'timestamps shared importers on an affected path (boundary first: %s, static imports: %s)',
      async (boundaryFirst, staticImports) => {
        const graph = new EnvironmentModuleGraph('client', async (url) => ({
          id: url,
        }))
        const [dep, boundary, affected, shared, ancestor] = await Promise.all(
          [
            '/dep.js',
            '/boundary.js',
            '/affected.js',
            '/shared.js',
            '/ancestor.js',
          ].map((url) => graph.ensureEntryFromUrl(url)),
        )
        dep.importers = new Set(
          boundaryFirst ? [boundary, affected] : [affected, boundary],
        )
        boundary.isSelfAccepting = true
        boundary.importers.add(shared)
        affected.importers.add(shared)
        shared.importers.add(ancestor)
        // Include a cycle to ensure revisiting an affected path terminates.
        ancestor.importers.add(shared)
        if (staticImports) {
          boundary.staticImportedUrls = new Set([dep.url])
          affected.staticImportedUrls = new Set([dep.url])
          shared.staticImportedUrls = new Set([
            boundary.url,
            affected.url,
            ancestor.url,
          ])
          ancestor.staticImportedUrls = new Set([shared.url])
        }
        for (const mod of [boundary, affected, shared, ancestor]) {
          graph.updateModuleTransformResult(mod, { code: '' })
        }

        graph.invalidateModule(dep, new Set(), 2, true)

        for (const mod of [dep, boundary, affected, shared, ancestor]) {
          expect(mod.lastHMRTimestamp, mod.url).toBe(2)
          expect(mod.transformResult, mod.url).toBeNull()
        }
      },
    )

    it('allows an explicit HMR invalidation above a self-accepting boundary', async () => {
      const graph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))
      const [boundary, parent, accepting] = await Promise.all(
        ['/boundary.js', '/parent.js', '/accepting.js'].map((url) =>
          graph.ensureEntryFromUrl(url),
        ),
      )
      boundary.isSelfAccepting = true
      boundary.importers.add(parent)
      parent.importers.add(accepting)
      accepting.acceptedHmrDeps.add(parent)
      const transform = { code: 'import "/parent.js"' }
      graph.updateModuleTransformResult(accepting, transform)
      const seen = new Set<typeof boundary>()

      graph.invalidateModule(boundary, seen, 2, true)
      expect(parent.lastHMRTimestamp).toBe(0)
      graph.invalidateModule(parent, seen, 2, true)
      expect(parent.lastHMRTimestamp).toBe(2)
      expect(accepting.lastHMRTimestamp).toBe(0)
      expect(accepting.transformResult).toBe(transform)
    })

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
})
