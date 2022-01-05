import { watch } from 'chokidar'
import type { UserConfig } from '../../config'
import { resolveConfig } from '../../config'
import type { Plugin } from '../../plugin'
import { ModuleGraph } from '../moduleGraph'
import type { PluginContainer } from '../pluginContainer'
import { createPluginContainer } from '../pluginContainer'

describe('plugin container', () => {
  describe('getModuleInfo', () => {
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

      const { moduleGraph, container, close } =
        await getPluginContainerAndModuleGraph({ plugins: [plugin] })

      const entryModule = await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      expect(entryModule.meta).toEqual({ x: 1 })

      const loadResult: any = await container.load(entryUrl)
      expect(loadResult?.meta).toEqual({ x: 2 })

      await container.transform(loadResult.code, entryUrl)
      await close()

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

      const { moduleGraph, container, close } =
        await getPluginContainerAndModuleGraph({ plugins: [plugin1, plugin2] })

      await moduleGraph.ensureEntryFromUrl(entryUrl, false)
      await container.load(entryUrl)
      await close()

      expect.assertions(1)
    })
  })
})

async function getPluginContainerAndModuleGraph(inlineConfig?: UserConfig) {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve'
  )

  // @ts-ignore: This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !/pre-alias/.test(p.name))

  const watcher = watch(__dirname, { ignoreInitial: true })

  const moduleGraph = new ModuleGraph(
    (url) => container.resolveId(url),
    (url) => container.load(url),
    config,
    watcher
  )
  const container = await createPluginContainer(config, moduleGraph)
  return {
    moduleGraph,
    container,
    close: () =>
      Promise.all([
        container.close(),
        moduleGraph.close(false),
        watcher.close()
      ])
  }
}
