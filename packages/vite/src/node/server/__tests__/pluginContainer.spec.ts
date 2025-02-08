import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it, vi } from 'vitest'
import type { UserConfig } from '../../config'
import { resolveConfig } from '../../config'
import type { Plugin } from '../../plugin'
import { DevEnvironment } from '../environment'
import { createLogger } from '../../logger'

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
            const { meta } = this.getModuleInfo(entryUrl) ?? {}
            metaArray.push(meta)

            return { code: 'export {}', meta: { x: 2 } }
          }
        },
        transform(_code, id) {
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

      const environment = await getDevEnvironment({
        plugins: [plugin],
      })

      const entryModule = await environment.moduleGraph.ensureEntryFromUrl(
        entryUrl,
        false,
      )
      expect(entryModule.meta).toEqual({ x: 1 })

      const loadResult: any = await environment.pluginContainer.load(entryUrl)
      expect(loadResult?.meta).toEqual({ x: 2 })

      await environment.pluginContainer.transform(loadResult.code, entryUrl)
      await environment.pluginContainer.close()

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

      const environment = await getDevEnvironment({
        plugins: [plugin1, plugin2],
      })

      await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
      await environment.pluginContainer.load(entryUrl)

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

      const environment = await getDevEnvironment({
        plugins: [plugin1, plugin2],
      })

      await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
      await environment.pluginContainer.load(entryUrl)

      expect.assertions(2)
    })
  })

  describe('options', () => {
    it('should not throw errors when this.debug is called', async () => {
      const plugin: Plugin = {
        name: 'p1',
        options() {
          this.debug('test')
        },
      }
      await getDevEnvironment({
        plugins: [plugin],
      })
    })

    const logFunctions = ['info', 'warn'] as const
    for (const logFunction of logFunctions) {
      it(`should support this.${logFunction}`, async () => {
        const logger = createLogger()
        const mockedFn = vi
          .spyOn(logger, logFunction)
          .mockImplementation(() => {})
        const plugin: Plugin = {
          name: 'p1',
          options() {
            this[logFunction]('test')
          },
        }
        await getDevEnvironment({
          plugins: [plugin],
          customLogger: logger,
        })
        expect(mockedFn).toHaveBeenCalledOnce()
      })
    }

    it('should support this.error', async () => {
      const plugin: Plugin = {
        name: 'p1',
        options() {
          this.error('test')
        },
      }
      await expect(() =>
        getDevEnvironment({
          plugins: [plugin],
        }),
      ).rejects.toThrowError('test')
    })
  })

  describe('load', () => {
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

      const environment = await getDevEnvironment({
        plugins: [plugin],
      })
      await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
      const loadResult: any = await environment.pluginContainer.load(entryUrl)
      const result: any = await environment.pluginContainer.transform(
        loadResult.code,
        entryUrl,
      )
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
        async transform(_code, id) {
          if (id === entryUrl) {
            // NOTE: ModuleInfo.code not implemented, used `.meta.code` for now
            return (await this.load({ id: otherUrl }))?.meta.code
          } else if (id === otherUrl) {
            return { code: '3', meta: { code: '3' } }
          }
        },
      }

      const environment = await getDevEnvironment({
        plugins: [plugin],
      })
      await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
      const loadResult: any = await environment.pluginContainer.load(entryUrl)
      const result: any = await environment.pluginContainer.transform(
        loadResult.code,
        entryUrl,
      )
      expect(result.code).equals('3')
    })

    it('should not throw errors when this.debug is called', async () => {
      const plugin: Plugin = {
        name: 'p1',
        load() {
          this.debug({ message: 'test', pos: 12 })
        },
      }
      const environment = await getDevEnvironment({
        plugins: [plugin],
      })
      await environment.pluginContainer.load('foo')
    })

    const logFunctions = ['info', 'warn'] as const
    for (const logFunction of logFunctions) {
      it(`should support this.${logFunction}`, async () => {
        const logger = createLogger()
        const mockedFn = vi
          .spyOn(logger, logFunction)
          .mockImplementation(() => {})
        const plugin: Plugin = {
          name: 'p1',
          load() {
            this[logFunction]({ message: 'test', pos: 12 })
          },
        }
        const environment = await getDevEnvironment({
          plugins: [plugin],
          customLogger: logger,
        })
        await environment.pluginContainer.load('foo')
        expect(mockedFn).toHaveBeenCalledOnce()
        expect(stripVTControlCharacters(mockedFn.mock.calls[0][0])).toBe(
          `${logFunction === 'warn' ? 'warning' : logFunction}: test\n` +
            '  Plugin: p1',
        )
      })
    }

    it('should support this.error', async () => {
      const plugin: Plugin = {
        name: 'p1',
        load() {
          this.error({ message: 'test', pos: 12 })
        },
      }
      const environment = await getDevEnvironment({
        plugins: [plugin],
      })
      await expect(() => environment.pluginContainer.load('foo')).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        {
          "message": "test",
          "plugin": "p1",
          "pos": 12,
        }
      `)
    })
  })

  describe('resolveId', () => {
    describe('skipSelf', () => {
      it('should skip the plugin itself when skipSelf is true', async () => {
        let calledCount = 0
        const plugin: Plugin = {
          name: 'p1',
          async resolveId(id, importer) {
            calledCount++
            if (calledCount <= 1) {
              return await this.resolve(id, importer, { skipSelf: true })
            }
            return id
          },
        }

        const environment = await getDevEnvironment({ plugins: [plugin] })
        await environment.pluginContainer.resolveId('/x.js')
        expect(calledCount).toBe(1)
      })

      it('should skip the plugin only when id and importer is same', async () => {
        const p1: Plugin = {
          name: 'p1',
          async resolveId(id, importer) {
            if (id === 'foo/modified') {
              return 'success'
            }
            return await this.resolve(id, importer, { skipSelf: true })
          },
        }
        const p2: Plugin = {
          name: 'p2',
          async resolveId(id, importer) {
            const resolved = await this.resolve(id + '/modified', importer, {
              skipSelf: true,
            })
            return resolved ?? 'failed'
          },
        }

        const environment = await getDevEnvironment({ plugins: [p1, p2] })
        const result = await environment.pluginContainer.resolveId('foo')
        expect(result).toStrictEqual({ id: 'success' })
      })

      it('should skip the plugin if it has been called before with the same id and importer (1)', async () => {
        const p1: Plugin = {
          name: 'p1',
          async resolveId(id, importer) {
            return (
              (await this.resolve(id.replace(/\/modified$/, ''), importer, {
                skipSelf: true,
              })) ?? 'success'
            )
          },
        }
        const p2: Plugin = {
          name: 'p2',
          async resolveId(id, importer) {
            return await this.resolve(id + '/modified', importer, {
              skipSelf: true,
            })
          },
        }
        const environment = await getDevEnvironment({ plugins: [p1, p2] })
        const result = await environment.pluginContainer.resolveId('foo')
        expect(result).toStrictEqual({ id: 'success' })
      })

      it('should skip the plugin if it has been called before with the same id and importer (2)', async () => {
        const p1: Plugin = {
          name: 'p1',
          async resolveId(id, importer) {
            return (
              (await this.resolve(id.replace(/\/modified$/, ''), importer, {
                skipSelf: true,
              })) ?? 'failure1'
            )
          },
        }
        const p2: Plugin = {
          name: 'p2',
          async resolveId(id, importer) {
            return await this.resolve(id + '/modified', importer, {
              skipSelf: true,
            })
          },
        }
        const p3: Plugin = {
          name: 'p3',
          resolveId(id) {
            if (id.endsWith('/modified')) {
              return 'success'
            }
            return 'failure2'
          },
        }
        const environment = await getDevEnvironment({ plugins: [p1, p2, p3] })
        const result = await environment.pluginContainer.resolveId('foo')
        expect(result).toStrictEqual({ id: 'success' })
      })
    })
  })
})

async function getDevEnvironment(
  inlineConfig?: UserConfig,
): Promise<DevEnvironment> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )

  // @ts-expect-error This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !p.name.includes('pre-alias'))

  const environment = new DevEnvironment('client', config, { hot: true })
  await environment.init()

  return environment
}
