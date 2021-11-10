import { resolveConfig, UserConfig } from '../../config'
import { Plugin } from '../../plugin'
import { ModuleGraph } from '../moduleGraph'
import { createPluginContainer, PluginContainer } from '../pluginContainer'

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
            const { meta } = this.getModuleInfo(entryUrl)
            metaArray.push(meta)

            return { code: 'export {}', meta: { x: 2 } }
          }
        },
        transform(code, id) {
          if (id === entryUrl) {
            const { meta } = this.getModuleInfo(entryUrl)
            metaArray.push(meta)

            return { meta: { x: 3 } }
          }
        },
        buildEnd() {
          const { meta } = this.getModuleInfo(entryUrl)
          metaArray.push(meta)
        }
      }

      const container = await getPluginContainer({
        plugins: [plugin]
      })

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl)
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
        }
      }

      const plugin2: Plugin = {
        name: 'p2',
        load(id) {
          if (id === entryUrl) {
            const { meta } = this.getModuleInfo(entryUrl)
            expect(meta).toEqual({ x: 1 })
            return null
          }
        }
      }

      const container = await getPluginContainer({
        plugins: [plugin1, plugin2]
      })

      await moduleGraph.ensureEntryFromUrl(entryUrl)
      await container.load(entryUrl)

      expect.assertions(1)
    })
  })
})

async function getPluginContainer(
  inlineConfig?: UserConfig
): Promise<PluginContainer> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve'
  )

  // @ts-ignore: This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !/pre-alias/.test(p.name))

  resolveId = (id) => container.resolveId(id)
  const container = await createPluginContainer(config, moduleGraph)
  return container
}
