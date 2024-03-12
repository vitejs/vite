import { beforeEach, describe, expect, it } from 'vitest'
import type { UserConfig } from '../../config'
import { resolveConfig } from '../../config'
import type { Plugin } from '../../plugin'
import { ModuleGraph } from '../moduleGraph'
import type { PluginContainer } from '../pluginContainer'
import { createPluginContainer } from '../pluginContainer'

let resolveId: (id: string) => any
let moduleGraph: ModuleGraph

describe('plugin container', () => {
  describe('getModuleInfo', () => {
    beforeEach(() => {
      moduleGraph = new ModuleGraph((id) => resolveId(id))
    })

    it('can pass metadata between hooks', async () => {
      const entryUrl = '/x.js'

      const metaArray: any[] = []
      const plugin: Plugin = {
        name: 'p1',
        resolveId(id) {
          if (id === entryUrl) {
            // The module hasn't been resolved yet, so its info is null.
            const moduleInfo = this.getModuleInfo(entryUrl)
            expect(moduleInfo).toEqual(null)

            return { id, meta: { x: 1 } }
          }
        },
        load(id) {
          if (id === entryUrl) {
            const { meta } = this.getModuleInfo(entryUrl) ?? {}
            metaArray.push(meta)

            return { code: 'export {}', meta: { x: 2 } }
          }
        },
        transform(code, id) {
          if (id === entryUrl) {
            const { meta } = this.getModuleInfo(entryUrl) ?? {}
            metaArray.push(meta)

            return { meta: { x: 3 } }
          }
        },
        buildEnd() {
          const { meta } = this.getModuleInfo(entryUrl) ?? {}
          metaArray.push(meta)
        },
      }

      const container = await getPluginContainer({
        plugins: [plugin],
      })

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      expect(entryModule.meta).toEqual({ x: 1 })

      const loadResult: any = await container.load(entryUrl)
      expect(loadResult?.meta).toEqual({ x: 2 })

      await container.transform(loadResult.code, entryUrl)
      await container.close()

      expect(metaArray).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }])
    })

    it('can pass metadata between plugins', async () => {
      const entryUrl = '/x.js'

      const plugin1: Plugin = {
        name: 'p1',
        resolveId(id) {
          if (id === entryUrl) {
            return { id, meta: { x: 1 } }
          }
        },
      }

      const plugin2: Plugin = {
        name: 'p2',
        load(id) {
          if (id === entryUrl) {
            const { meta } = this.getModuleInfo(entryUrl) ?? {}
            expect(meta).toEqual({ x: 1 })
            return null
          }
        },
      }

      const container = await getPluginContainer({
        plugins: [plugin1, plugin2],
      })

      await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      await container.load(entryUrl)

      expect.assertions(1)
    })

    it('can pass custom resolve opts between plugins', async () => {
      const entryUrl = '/x.js'

      const plugin1: Plugin = {
        name: 'p1',
        resolveId(id) {
          if (id === entryUrl) {
            return this.resolve('foobar', 'notreal', {
              custom: { p1: 'success' },
              isEntry: true,
            })
          }
        },
      }

      const plugin2: Plugin = {
        name: 'p2',
        resolveId(id, importer, opts) {
          if (id === 'foobar') {
            expect(importer).toBe('notreal')
            expect(opts).toEqual(
              expect.objectContaining({
                custom: { p1: 'success' },
                isEntry: true,
              }),
            )
            return entryUrl
          }
        },
        load(id) {
          if (id === entryUrl) {
            return null
          }
        },
      }

      const container = await getPluginContainer({
        plugins: [plugin1, plugin2],
      })

      await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      await container.load(entryUrl)

      expect.assertions(2)
    })
  })

  describe('load', () => {
    beforeEach(() => {
      moduleGraph = new ModuleGraph((id) => resolveId(id))
    })

    it('can resolve a secondary module', async () => {
      const entryUrl = '/x.js'

      const plugin: Plugin = {
        name: 'p1',
        resolveId(id) {
          return id
        },
        load(id) {
          if (id === entryUrl) return { code: '1', meta: { x: 1 } }
          else return { code: '2', meta: { x: 2 } }
        },
        async transform(code, id) {
          if (id === entryUrl)
            return {
              code: `${
                (await this.load({ id: '/secondary.js' })).meta.x || undefined
              }`,
            }
          return { code }
        },
      }

      const container = await getPluginContainer({
        plugins: [plugin],
      })
      await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      const loadResult: any = await container.load(entryUrl)
      const result: any = await container.transform(loadResult.code, entryUrl)
      expect(result.code).equals('2')
    })

    it('will load and transform the module', async () => {
      const entryUrl = '/x.js'
      const otherUrl = '/y.js'

      const plugin: Plugin = {
        name: 'p1',
        resolveId(id) {
          return id
        },
        load(id) {
          if (id === entryUrl) return { code: '1' }
          else if (id === otherUrl) return { code: '2', meta: { code: '2' } }
        },
        async transform(code, id) {
          if (id === entryUrl) {
            // NOTE: ModuleInfo.code not implemented, used `.meta.code` for now
            return (await this.load({ id: otherUrl }))?.meta.code
          } else if (id === otherUrl) {
            return { code: '3', meta: { code: '3' } }
          }
        },
      }

      const container = await getPluginContainer({
        plugins: [plugin],
      })
      await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      const loadResult: any = await container.load(entryUrl)
      const result: any = await container.transform(loadResult.code, entryUrl)
      expect(result.code).equals('3')
    })
  })
})

async function getPluginContainer(
  inlineConfig?: UserConfig,
): Promise<PluginContainer> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )

  // @ts-expect-error This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !p.name.includes('pre-alias'))

  resolveId = (id) => container.resolveId(id)
  const container = await createPluginContainer(config, moduleGraph)
  return container
}
