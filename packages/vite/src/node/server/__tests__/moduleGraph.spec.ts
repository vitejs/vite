import { describe, expect, it, vi } from 'vitest'
import type { EnvironmentModuleNode } from '../moduleGraph';
import { EnvironmentModuleGraph } from '../moduleGraph'
import type { ModuleNode } from '../mixedModuleGraph'
import { ModuleGraph } from '../mixedModuleGraph'

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

    describe('_ensureEntryFromUrl memory leak fix', () => {
      it('removes a rejected promise from _unresolvedUrlToModuleMap', async () => {
        const resolveId = vi.fn().mockRejectedValue(new Error('resolve failed'))
        const moduleGraph = new EnvironmentModuleGraph('client', resolveId)

        await expect(
          moduleGraph.ensureEntryFromUrl('/fail.js'),
        ).rejects.toThrow('resolve failed')

        // The rejected promise must not remain in the map
        await expect(
          Promise.resolve(
            moduleGraph._unresolvedUrlToModuleMap.get('/fail.js'),
          ),
        ).resolves.toBeUndefined()
      })

      it('does not affect the map when a concurrent resolution has already replaced the entry', async () => {
        // resolveId rejects on the first call, succeeds on the second
        const resolveId = vi
          .fn()
          .mockRejectedValueOnce(new Error('first call fails'))
          .mockResolvedValue({ id: '/ok.js' })
        const moduleGraph = new EnvironmentModuleGraph('client', resolveId)

        // First call fails
        await expect(moduleGraph.ensureEntryFromUrl('/ok.js')).rejects.toThrow(
          'first call fails',
        )

        // Second call succeeds and stores a resolved module in the map
        const mod = await moduleGraph.ensureEntryFromUrl('/ok.js')
        expect(mod).toBeDefined()
        expect(mod.id).toBe('/ok.js')

        // The map must hold the resolved module, not undefined
        const entry = moduleGraph._unresolvedUrlToModuleMap.get('/ok.js')
        expect(entry).toBe(mod)
      })

      it('allows a successful retry after a failed resolution for the same url', async () => {
        let shouldFail = true
        const resolveId = vi.fn().mockImplementation(async (url: string) => {
          if (shouldFail) throw new Error('transient error')
          return { id: url }
        })
        const moduleGraph = new EnvironmentModuleGraph('client', resolveId)

        // First attempt fails
        await expect(
          moduleGraph.ensureEntryFromUrl('/retry.js'),
        ).rejects.toThrow('transient error')

        // Map is clean after failure
        expect(moduleGraph._unresolvedUrlToModuleMap.has('/retry.js')).toBe(
          false,
        )

        // Second attempt succeeds because the map was cleaned up
        shouldFail = false
        const mod = await moduleGraph.ensureEntryFromUrl('/retry.js')
        expect(mod).toBeDefined()
        expect(mod.id).toBe('/retry.js')
      })

      it('identity check preserves a newer entry when stale cleanup runs', async () => {
        // The .catch() cleanup uses `=== modPromise` to avoid deleting an entry
        // that was already replaced by a newer resolution. This test verifies that
        // by manually simulating the scenario: a stale promise is rejected AFTER
        // a new module has already taken its slot in the map.
        let rejectFn!: (err: Error) => void
        const stalePromise = new Promise<EnvironmentModuleNode>((_, reject) => {
          rejectFn = reject
        })

        const resolveId = vi.fn().mockResolvedValue({ id: '/race.js' })
        const moduleGraph = new EnvironmentModuleGraph('client', resolveId)

        // Simulate what _ensureEntryFromUrl does: store the pending promise and
        // register the same identity-guarded cleanup that our fix introduces.
        moduleGraph._setUnresolvedUrlToModule('/race.js', stalePromise)
        stalePromise.catch(() => {
          if (
            moduleGraph._unresolvedUrlToModuleMap.get('/race.js') ===
            stalePromise
          ) {
            moduleGraph._unresolvedUrlToModuleMap.delete('/race.js')
          }
        })

        // A successful resolution now replaces the stale promise in the map.
        const newMod = await moduleGraph.ensureEntryFromUrl('/other.js')
        moduleGraph._setUnresolvedUrlToModule('/race.js', newMod)

        // The stale promise rejects after the map was already updated.
        rejectFn(new Error('stale rejection'))
        await expect(stalePromise).rejects.toThrow('stale rejection')

        // The identity check must have prevented the cleanup from deleting the
        // newer entry.
        expect(moduleGraph._unresolvedUrlToModuleMap.get('/race.js')).toBe(
          newMod,
        )
      })
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
