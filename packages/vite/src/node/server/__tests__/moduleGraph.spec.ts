import { describe, expect, it } from 'vitest'
import { isWindows } from '../../../shared/utils'
import { EnvironmentModuleGraph } from '../moduleGraph'
import type { ModuleNode } from '../mixedModuleGraph'
import { ModuleGraph } from '../mixedModuleGraph'

describe('moduleGraph', () => {
  describe('onFileChange', () => {
    it('normalizes redundant slashes in path before lookup', () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      // Module keyed with a normalized path
      const normalizedPath = '/project/src/foo.ts'
      const mod = moduleGraph.createFileOnlyEntry(normalizedPath)
      expect(mod.lastInvalidationTimestamp).toBe(0)

      // path.posix.normalize collapses double-slashes on all platforms —
      // onFileChange must normalize before lookup or it would miss the module
      moduleGraph.onFileChange('/project//src/foo.ts')

      expect(mod.lastInvalidationTimestamp).toBeGreaterThan(0)
    })

    it(
      'normalizes Windows backslash paths before lookup',
      { skip: !isWindows },
      () => {
        const moduleGraph = new EnvironmentModuleGraph(
          'client',
          async (url) => ({ id: url }),
        )

        // Module stored under a forward-slash key (as normalizePath produces)
        const forwardSlashPath = 'C:/project/src/foo.ts'
        const mod = moduleGraph.createFileOnlyEntry(forwardSlashPath)
        expect(mod.lastInvalidationTimestamp).toBe(0)

        // Windows chokidar emits backslash paths — onFileChange must normalize before lookup
        moduleGraph.onFileChange('C:\\project\\src\\foo.ts')

        expect(mod.lastInvalidationTimestamp).toBeGreaterThan(0)
      },
    )
  })

  describe('getModulesByFile', () => {
    it('normalizes redundant slashes in path before lookup', () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      const normalizedPath = '/project/src/foo.ts'
      moduleGraph.createFileOnlyEntry(normalizedPath)

      expect(moduleGraph.getModulesByFile('/project//src/foo.ts')).toBeDefined()
    })

    it(
      'normalizes Windows backslash paths before lookup',
      { skip: !isWindows },
      () => {
        const moduleGraph = new EnvironmentModuleGraph(
          'client',
          async (url) => ({ id: url }),
        )

        const forwardSlashPath = 'C:/project/src/foo.ts'
        moduleGraph.createFileOnlyEntry(forwardSlashPath)

        expect(
          moduleGraph.getModulesByFile('C:\\project\\src\\foo.ts'),
        ).toBeDefined()
      },
    )
  })

  describe('onFileDelete', () => {
    it('normalizes redundant slashes in path before lookup', () => {
      const moduleGraph = new EnvironmentModuleGraph('client', async (url) => ({
        id: url,
      }))

      const normalizedPath = '/project/src/foo.ts'
      moduleGraph.createFileOnlyEntry(normalizedPath)

      // Should not throw and should find the module via the un-normalized path
      expect(() =>
        moduleGraph.onFileDelete('/project//src/foo.ts'),
      ).not.toThrow()
    })

    it(
      'normalizes Windows backslash paths before lookup',
      { skip: !isWindows },
      () => {
        const moduleGraph = new EnvironmentModuleGraph(
          'client',
          async (url) => ({ id: url }),
        )

        const forwardSlashPath = 'C:/project/src/foo.ts'
        moduleGraph.createFileOnlyEntry(forwardSlashPath)

        expect(() =>
          moduleGraph.onFileDelete('C:\\project\\src\\foo.ts'),
        ).not.toThrow()
      },
    )
  })

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
})
