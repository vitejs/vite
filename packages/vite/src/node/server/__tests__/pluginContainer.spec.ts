import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import MagicString from 'magic-string'
import { describe, expect, it, vi } from 'vitest'
import type { FSWatcher } from '#dep-types/chokidar'
import type { UserConfig } from '../../config'
import { resolveConfig } from '../../config'
import { createLogger } from '../../logger'
import type { Plugin } from '../../plugin'
import { DevEnvironment } from '../environment'

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

  describe('transform', () => {
    it('combines a plugin sourcemap with `sources: [""]` (#13657)', async () => {
      const entryUrl = '/zoo.js'
      const originalCode = `export const zoo = 'zoo'\n`

      const plugin: Plugin = {
        name: 'p1',
        transform(code, id) {
          if (id === entryUrl) {
            const ms = new MagicString(code)
            ms.append('// add comment')
            return {
              code: ms.toString(),
              // NOTE: MagicString without `filename` option generates
              //       a sourcemap with `sources: ['']` or `sources: [null]`
              map: ms.generateMap({ hires: true }),
            }
          }
        },
      }

      const environment = await getDevEnvironment({ plugins: [plugin] })
      await environment.moduleGraph.ensureEntryFromUrl(entryUrl, false)
      const result = await environment.pluginContainer.transform(
        originalCode,
        entryUrl,
      )

      expect(result.code).toContain('// add comment')
      // the empty source must be replaced with the module id + original code
      expect(result.map).toMatchInlineSnapshot(`
        {
          "file": undefined,
          "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;",
          "names": [],
          "sources": [
            "/zoo.js",
          ],
          "sourcesContent": [
            "export const zoo = 'zoo'
        ",
          ],
          "version": 3,
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
            if (id !== '/x.js') return
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

  describe('addWatchFile', () => {
    it('does not re-arm the watcher for a hook call still pending when the container is closed (#18224)', async () => {
      // The watched file must exist on disk and be outside the environment
      // root for `ensureWatchedFile` to call `watcher.add`.
      const watchedFile = path.join(
        fs.realpathSync(os.tmpdir()),
        `vite-plugin-container-watch-test-${Date.now()}.txt`,
      )
      fs.writeFileSync(watchedFile, '')

      try {
        const watcher = { add: vi.fn() } as unknown as FSWatcher

        let resolveTransformStarted: () => void
        const transformStarted = new Promise<void>((resolve) => {
          resolveTransformStarted = resolve
        })
        let resolveTransform: () => void
        const canFinishTransform = new Promise<void>((resolve) => {
          resolveTransform = resolve
        })

        const plugin: Plugin = {
          name: 'p1',
          async transform(_code, id) {
            if (id === '/x.js') {
              resolveTransformStarted()
              await canFinishTransform
              // Simulates a plugin (e.g. vite:css) calling `addWatchFile`
              // after the server/container has already been closed.
              this.addWatchFile(watchedFile)
            }
          },
        }

        const environment = await getDevEnvironment(
          { plugins: [plugin] },
          watcher,
        )
        await environment.moduleGraph.ensureEntryFromUrl('/x.js', false)

        const transformPromise = environment.pluginContainer.transform(
          '',
          '/x.js',
        )
        await transformStarted

        const closePromise = environment.pluginContainer.close()
        resolveTransform!()

        // Once closed, any plugin transform hook running after `p1` in the
        // pipeline will reject with a "closed server" error, which is
        // expected and unrelated to what this test checks.
        await transformPromise.catch(() => {})
        await closePromise

        expect(watcher.add).not.toHaveBeenCalled()
      } finally {
        fs.rmSync(watchedFile)
      }
    })
  })

  describe('closeBundle', () => {
    it('passes buildEnd errors to closeBundle', async () => {
      const buildEndError = new Error('buildEnd failed')
      let closeBundleError: Error | undefined
      const environment = await getDevEnvironment({
        plugins: [
          {
            name: 'failing-build-end',
            buildEnd() {
              throw buildEndError
            },
          },
          {
            name: 'close-bundle-cleanup',
            closeBundle(error) {
              closeBundleError = error
            },
          },
        ],
      })

      await expect(environment.pluginContainer.close()).rejects.toBe(
        buildEndError,
      )
      expect(closeBundleError).toBe(buildEndError)
    })

    it('passes no error to closeBundle when buildEnd succeeds', async () => {
      let buildEndCalled = false
      let closeBundleCalled = false
      let closeBundleError: Error | undefined
      const environment = await getDevEnvironment({
        plugins: [
          {
            name: 'successful-build-end',
            buildEnd() {
              buildEndCalled = true
            },
          },
          {
            name: 'close-bundle-cleanup',
            closeBundle(error) {
              closeBundleCalled = true
              closeBundleError = error
            },
          },
        ],
      })

      await expect(environment.pluginContainer.close()).resolves.toBeUndefined()
      expect(buildEndCalled).toBe(true)
      expect(closeBundleCalled).toBe(true)
      expect(closeBundleError).toBeUndefined()
    })
  })
})

async function getDevEnvironment(
  inlineConfig?: UserConfig,
  watcher?: FSWatcher,
): Promise<DevEnvironment> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )

  // @ts-expect-error This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter((p) => !p.name.includes('pre-alias'))

  const environment = new DevEnvironment('client', config, { hot: true })
  await environment.init({ watcher })

  return environment
}
