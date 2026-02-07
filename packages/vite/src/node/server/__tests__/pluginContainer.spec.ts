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
            } as any)
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

  describe('transform', () => {
    describe('plugin hook mutation edge cases', () => {
      it('should not crash when plugin deletes transform hook in configResolved', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'mutable-transform-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const modified = true' }
          },
          configResolved() {
            // Simulate vite-plugin-react behavior
            delete (this as any).transform
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        // Should not throw - plugin was cached with transform but hook was deleted
        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should handle plugin that sets transform to null in configResolved', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'null-transform-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const modified = true' }
          },
          configResolved() {
            ;(this as any).transform = null
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should handle plugin that sets transform to undefined in configResolved', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'undefined-transform-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const modified = true' }
          },
          configResolved() {
            ;(this as any).transform = undefined
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should skip plugins without transform and continue with others', async () => {
        const entryUrl = '/x.js'
        let normalPluginCalled = false

        const pluginThatRemovesTransform: Plugin = {
          name: 'remover-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const modified1 = true' }
          },
          configResolved() {
            delete (this as any).transform
          },
        }

        const normalPlugin: Plugin = {
          name: 'normal-plugin',
          transform(code) {
            normalPluginCalled = true
            return { code: code + '\n// normal plugin' }
          },
        }

        const environment = await getDevEnvironment({
          plugins: [pluginThatRemovesTransform, normalPlugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toContain('// normal plugin')
        expect(normalPluginCalled).toBe(true)
      })

      it('should handle multiple plugins all removing their transform hooks', async () => {
        const entryUrl = '/x.js'

        const plugin1: Plugin = {
          name: 'remover-1',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const p1 = true' }
          },
        }

        const plugin2: Plugin = {
          name: 'remover-2',
          transform() {
            return { code: 'export const p2 = true' }
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin1, plugin2],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        // First transform to populate cache
        await environment.pluginContainer.transform(loadResult.code, entryUrl)

        // Simulate plugin removing its own transform hook after cache is populated
        // (this mimics what happens during server restart or plugin mutation)
        delete (plugin1 as any).transform
        delete (plugin2 as any).transform

        // Second transform should not crash even though hooks are now undefined
        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBe('export {}')
      })

      it('should work normally when transform is not deleted', async () => {
        const entryUrl = '/x.js'
        let transformCount = 0

        const plugin: Plugin = {
          name: 'normal-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export const a = 1' }
          },
          transform(code) {
            transformCount++
            return { code: code + '\nexport const b = 2' }
          },
          configResolved() {
            // Normal configResolved - no deletion
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(transformCount).toBe(1)
        expect(result.code).toContain('export const a = 1')
        expect(result.code).toContain('export const b = 2')
      })

      it('should handle transform hooks with object syntax and order', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'ordered-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform: {
            order: 'pre' as const,
            handler() {
              return { code: 'export const pre = true' }
            },
          },
          configResolved() {
            delete (this as any).transform
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should handle conditional transform deletion based on config', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'conditional-plugin',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            return { code: 'export const transformed = true' }
          },
          configResolved(config) {
            // Simulate vite-plugin-react behavior - remove if no need to transform
            if (config.mode === 'production') {
              delete (this as any).transform
            }
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
          mode: 'production',
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should not skip plugin when transform returns null/undefined', async () => {
        const entryUrl = '/x.js'
        let secondPluginCalled = false

        const pluginReturningNull: Plugin = {
          name: 'null-returner',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform() {
            // Return null - should continue to next plugin
            return null
          },
        }

        const secondPlugin: Plugin = {
          name: 'second-plugin',
          transform(code) {
            secondPluginCalled = true
            return { code: code + '\n// second' }
          },
        }

        const environment = await getDevEnvironment({
          plugins: [pluginReturningNull, secondPlugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(secondPluginCalled).toBe(true)
        expect(result.code).toContain('// second')
      })

      it('should handle transform that was an async function but deleted', async () => {
        const entryUrl = '/x.js'

        const plugin: Plugin = {
          name: 'async-remover',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform: async function () {
            return { code: 'export const async = true' }
          },
          configResolved() {
            delete (this as any).transform
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(result.code).toBeDefined()
      })

      it('should handle chained transform with one removing its hook', async () => {
        const entryUrl = '/x.js'
        const calls: string[] = []

        const plugin1: Plugin = {
          name: 'chain-1',
          resolveId(id) {
            if (id === entryUrl) return id
          },
          load(id) {
            if (id === entryUrl) return { code: 'export {}' }
          },
          transform(code) {
            calls.push('plugin1')
            return { code: code + '\n// p1' }
          },
        }

        const plugin2: Plugin = {
          name: 'chain-2',
          transform(code) {
            calls.push('plugin2')
            return { code: code + '\n// p2' }
          },
        }

        const plugin3: Plugin = {
          name: 'chain-3',
          transform(code) {
            calls.push('plugin3')
            return { code: code + '\n// p3' }
          },
        }

        const environment = await getDevEnvironment({
          plugins: [plugin1, plugin2, plugin3],
        })
        await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
        const loadResult: any = await environment.pluginContainer.load(entryUrl)

        // First transform to populate cache - all plugins should run
        await environment.pluginContainer.transform(loadResult.code, entryUrl)
        expect(calls).toContain('plugin1')
        expect(calls).toContain('plugin2')
        expect(calls).toContain('plugin3')

        // Clear calls and simulate plugin1 removing its transform
        calls.length = 0
        delete (plugin1 as any).transform

        // Second transform should skip plugin1 but run plugin2 and plugin3
        const result = await environment.pluginContainer.transform(
          loadResult.code,
          entryUrl,
        )
        expect(calls).toContain('plugin2')
        expect(calls).toContain('plugin3')
        expect(calls).not.toContain('plugin1')
        expect(result.code).toContain('// p2')
        expect(result.code).toContain('// p3')
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
