import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { InlineConfig, PluginOption } from '..'
import type { UserConfig, UserConfigExport } from '../config'
import { defineConfig, loadConfigFromFile, resolveConfig } from '../config'
import { resolveEnvPrefix } from '../env'
import { mergeConfig } from '../utils'
import { createLogger } from '../logger'

describe('mergeConfig', () => {
  test('handles configs with different alias schemas', () => {
    const baseConfig = defineConfig({
      resolve: {
        alias: [
          {
            find: 'foo',
            replacement: 'foo-value',
          },
        ],
      },
    })

    const newConfig = defineConfig({
      resolve: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value',
        },
      },
    })

    const mergedConfig: UserConfigExport = {
      resolve: {
        alias: [
          {
            find: 'bar',
            replacement: 'bar-value',
          },
          {
            find: 'baz',
            replacement: 'baz-value',
          },
          {
            find: 'foo',
            replacement: 'foo-value',
          },
        ],
      },
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('keep object alias schema', () => {
    const baseConfig = {
      resolve: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value',
        },
      },
    }

    const newConfig = {
      resolve: {
        alias: {
          bar: 'bar-value-2',
          foo: 'foo-value',
        },
      },
    }

    const mergedConfig = {
      resolve: {
        alias: {
          bar: 'bar-value-2',
          baz: 'baz-value',
          foo: 'foo-value',
        },
      },
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('handles arrays', () => {
    const baseConfig: UserConfigExport = {
      envPrefix: 'string1',
    }

    const newConfig: UserConfigExport = {
      envPrefix: ['string2', 'string3'],
    }

    const mergedConfig: UserConfigExport = {
      envPrefix: ['string1', 'string2', 'string3'],
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('handles assetsInclude', () => {
    const baseConfig: UserConfigExport = {
      assetsInclude: 'some-string',
    }

    const newConfig: UserConfigExport = {
      assetsInclude: ['some-other-string', /regexp?/],
    }

    const mergedConfig: UserConfigExport = {
      assetsInclude: ['some-string', 'some-other-string', /regexp?/],
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('not handles alias not under `resolve`', () => {
    const baseConfig = {
      custom: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value',
        },
      },
    }

    const newConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          foo: 'foo-value',
        },
      },
    }

    const mergedConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          baz: 'baz-value',
          foo: 'foo-value',
        },
      },
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('merge array correctly', () => {
    const baseConfig = {
      foo: null,
    }

    const newConfig = {
      foo: ['bar'],
    }

    const mergedConfig = {
      foo: ['bar'],
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('handles ssr.noExternal', () => {
    const baseConfig: UserConfig = {
      ssr: {
        noExternal: true,
        external: true,
      },
    }

    const newConfig: UserConfig = {
      ssr: {
        noExternal: ['foo'],
        external: ['bar'],
      },
    }

    const mergedConfig: UserConfig = {
      ssr: {
        noExternal: true,
        external: true,
      },
    }

    // merging either ways, `ssr.noExternal: true` should take highest priority
    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
    expect(mergeConfig(newConfig, baseConfig)).toEqual(mergedConfig)
  })

  test('handles environments.*.resolve.noExternal', () => {
    const baseConfig = {
      environments: {
        ssr: {
          resolve: {
            noExternal: true,
          },
        },
      },
    }

    const newConfig = {
      environments: {
        ssr: {
          resolve: {
            noExternal: ['foo'],
          },
        },
      },
    }

    const mergedConfig = {
      environments: {
        ssr: {
          resolve: {
            noExternal: true,
          },
        },
      },
    }

    // merging either ways, `resolve.noExternal: true` should take highest priority
    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
    expect(mergeConfig(newConfig, baseConfig)).toEqual(mergedConfig)
  })

  test('merge ssr.noExternal and environments.ssr.resolve.noExternal', async () => {
    const oldTrue = await resolveConfig(
      {
        ssr: {
          noExternal: true,
        },
        environments: {
          ssr: {
            resolve: {
              noExternal: ['dep'],
            },
          },
        },
      },
      'serve',
    )
    expect(oldTrue.environments.ssr.resolve.noExternal).toEqual(true)

    const newTrue = await resolveConfig(
      {
        ssr: {
          noExternal: ['dep'],
        },
        environments: {
          ssr: {
            resolve: {
              noExternal: true,
            },
          },
        },
      },
      'serve',
    )
    expect(newTrue.environments.ssr.resolve.noExternal).toEqual(true)
  })

  test('handles server.hmr.server', () => {
    const httpServer = http.createServer()

    const baseConfig = { server: { hmr: { server: httpServer } } }
    const newConfig = { server: { hmr: { server: httpServer } } }

    const mergedConfig = mergeConfig(baseConfig, newConfig)

    // Server instance should not be recreated
    expect(mergedConfig.server.hmr.server).toBe(httpServer)
  })

  test('handles server.allowedHosts', () => {
    const baseConfig = {
      server: { allowedHosts: ['example.com'] },
    }

    const newConfig = {
      server: { allowedHosts: true },
    }

    const mergedConfig = {
      server: { allowedHosts: true },
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('throws error with functions', () => {
    const baseConfig = defineConfig(() => ({ base: 'base' }))
    const newConfig = defineConfig(() => ({ base: 'new' }))

    expect(() =>
      mergeConfig(
        // @ts-expect-error TypeScript shouldn't give you to pass a function as argument
        baseConfig,
        newConfig,
      ),
    ).toThrowError('Cannot merge config in form of callback')

    expect(() =>
      mergeConfig(
        {},
        // @ts-expect-error TypeScript shouldn't give you to pass a function as argument
        newConfig,
      ),
    ).toThrowError('Cannot merge config in form of callback')
  })

  test('handles `rollupOptions`', () => {
    const baseConfig = defineConfig({
      build: {
        rollupOptions: {
          treeshake: false,
        },
      },
      worker: {
        rollupOptions: {
          treeshake: false,
        },
      },
      optimizeDeps: {
        rollupOptions: {
          treeshake: false,
        },
      },
      ssr: {
        optimizeDeps: {
          rollupOptions: {
            treeshake: false,
          },
        },
      },
    })

    const newConfig = defineConfig({
      build: {
        rollupOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      worker: {
        rollupOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      optimizeDeps: {
        rollupOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      ssr: {
        optimizeDeps: {
          rollupOptions: {
            output: {
              minifyInternalExports: true,
            },
          },
        },
      },
    })

    const mergedConfig = mergeConfig(baseConfig, newConfig)

    const expected = {
      treeshake: false,
      output: {
        minifyInternalExports: true,
      },
    }
    expect(mergedConfig.build.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.build.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.worker.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.worker.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.ssr.optimizeDeps.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.ssr.optimizeDeps.rolldownOptions).toStrictEqual(
      expected,
    )
  })

  test('handles `build.rolldownOptions`', () => {
    const baseConfig = defineConfig({
      build: {
        rolldownOptions: {
          treeshake: false,
        },
      },
      worker: {
        rolldownOptions: {
          treeshake: false,
        },
      },
      optimizeDeps: {
        rolldownOptions: {
          treeshake: false,
        },
      },
      ssr: {
        optimizeDeps: {
          rolldownOptions: {
            treeshake: false,
          },
        },
      },
    })

    const newConfig = defineConfig({
      build: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      worker: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      optimizeDeps: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      ssr: {
        optimizeDeps: {
          rolldownOptions: {
            output: {
              minifyInternalExports: true,
            },
          },
        },
      },
    })

    const mergedConfig = mergeConfig(baseConfig, newConfig)

    const expected = {
      treeshake: false,
      output: {
        minifyInternalExports: true,
      },
    }
    expect(mergedConfig.build.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.build.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.worker.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.worker.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.ssr.optimizeDeps.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.ssr.optimizeDeps.rolldownOptions).toStrictEqual(
      expected,
    )
  })

  test('syncs `build.rollupOptions` and `build.rolldownOptions`', () => {
    const baseConfig = defineConfig({
      build: {
        rollupOptions: {
          treeshake: false,
        },
      },
      worker: {
        rollupOptions: {
          treeshake: false,
        },
      },
      optimizeDeps: {
        rollupOptions: {
          treeshake: false,
        },
      },
      ssr: {
        optimizeDeps: {
          rollupOptions: {
            treeshake: false,
          },
        },
      },
    })

    const newConfig = defineConfig({
      build: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      worker: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      optimizeDeps: {
        rolldownOptions: {
          output: {
            minifyInternalExports: true,
          },
        },
      },
      ssr: {
        optimizeDeps: {
          rollupOptions: {
            output: {
              minifyInternalExports: true,
            },
          },
        },
      },
    })

    const mergedConfig = mergeConfig(baseConfig, newConfig) as UserConfig

    const expected = {
      treeshake: false,
      output: {
        minifyInternalExports: true,
      },
    }
    expect(mergedConfig.build!.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.build!.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.worker!.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.worker!.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps!.rollupOptions).toStrictEqual(expected)
    expect(mergedConfig.optimizeDeps!.rolldownOptions).toStrictEqual(expected)
    expect(mergedConfig.ssr!.optimizeDeps!.rollupOptions).toStrictEqual(
      expected,
    )
    expect(mergedConfig.ssr!.optimizeDeps!.rolldownOptions).toStrictEqual(
      expected,
    )

    const upOutput = mergedConfig.build!.rollupOptions!.output!
    if (Array.isArray(upOutput)) throw new Error()
    const downOutput = mergedConfig.build!.rolldownOptions!.output!
    if (Array.isArray(downOutput)) throw new Error()
    upOutput.hashCharacters = 'base36'
    expect(upOutput.hashCharacters).toBe('base36')
    expect(downOutput.hashCharacters).toBe('base36')
  })

  test('rollupOptions/rolldownOptions.platform', async () => {
    const testRollupOptions = await resolveConfig(
      {
        plugins: [
          {
            name: 'set-rollupOptions-platform',
            configEnvironment(name) {
              if (name === 'ssr') {
                return {
                  build: {
                    rollupOptions: {
                      platform: 'neutral',
                    },
                  },
                }
              }
            },
          },
        ],
      },
      'serve',
    )
    expect(
      testRollupOptions.environments.ssr.build.rolldownOptions.platform,
    ).toBe('neutral')
    expect(
      testRollupOptions.environments.client.build.rolldownOptions.platform,
    ).toBe('browser')

    const testRolldownOptions = await resolveConfig(
      {
        plugins: [
          {
            name: 'set-rollupOptions-platform',
            configEnvironment(name) {
              if (name === 'ssr') {
                return {
                  build: {
                    rolldownOptions: {
                      platform: 'neutral',
                    },
                  },
                }
              }
            },
          },
        ],
      },
      'serve',
    )
    expect(
      testRolldownOptions.environments.ssr.build.rolldownOptions.platform,
    ).toBe('neutral')
    expect(
      testRolldownOptions.environments.client.build.rolldownOptions.platform,
    ).toBe('browser')
  })
})

describe('resolveEnvPrefix', () => {
  test(`use 'VITE_' as default value`, () => {
    const config: UserConfig = {}
    expect(resolveEnvPrefix(config)).toMatchObject(['VITE_'])
  })

  test(`throw error if envPrefix contains ''`, () => {
    let config: UserConfig = { envPrefix: '' }
    expect(() => resolveEnvPrefix(config)).toThrow()
    config = { envPrefix: ['', 'CUSTOM_'] }
    expect(() => resolveEnvPrefix(config)).toThrow()
  })

  test(`show a warning message if envPrefix contains a whitespace`, () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    let config: UserConfig = { envPrefix: 'WITH SPACE' }
    resolveEnvPrefix(config)
    expect(consoleWarnSpy).toHaveBeenCalled()
    config = { envPrefix: ['CUSTOM_', 'ANOTHER SPACE'] }
    resolveEnvPrefix(config)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
    consoleWarnSpy.mockRestore()
  })

  test('should work correctly for valid envPrefix value', () => {
    const config: UserConfig = { envPrefix: ['CUSTOM_'] }
    expect(resolveEnvPrefix(config)).toMatchObject(['CUSTOM_'])
  })
})

describe('preview config', () => {
  const serverConfig = () => ({
    port: 3003,
    strictPort: true,
    host: true,
    open: true,
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: { '/foo': 'http://localhost:4567' },
    cors: true,
  })

  test('preview inherits server config with default port', async () => {
    const config: InlineConfig = {
      server: serverConfig(),
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: {
        ...serverConfig(),
        port: 4173,
      },
    })
  })

  test('preview inherits server config with port override', async () => {
    const config: InlineConfig = {
      server: serverConfig(),
      preview: {
        port: 3006,
      },
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: {
        ...serverConfig(),
        port: 3006,
      },
    })
  })

  const previewConfig = () => ({
    port: 3006,
    strictPort: false,
    open: false,
    host: false,
    proxy: { '/bar': 'http://localhost:3010' },
    cors: false,
  })

  test('preview overrides server config', async () => {
    const config: InlineConfig = {
      server: serverConfig(),
      preview: previewConfig(),
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: previewConfig(),
    })
  })
})

describe('resolveConfig', () => {
  const keepScreenMergePlugin = (): PluginOption => {
    return {
      name: 'vite-plugin-keep-screen-merge',
      config() {
        return { clearScreen: false }
      },
    }
  }

  const keepScreenOverridePlugin = (): PluginOption => {
    return {
      name: 'vite-plugin-keep-screen-override',
      config(config) {
        config.clearScreen = false
      },
    }
  }

  test('plugin merges `clearScreen` option', async () => {
    const config1: InlineConfig = { plugins: [keepScreenMergePlugin()] }
    const config2: InlineConfig = {
      plugins: [keepScreenMergePlugin()],
      clearScreen: true,
    }

    const results1 = await resolveConfig(config1, 'build')
    const results2 = await resolveConfig(config2, 'build')

    expect(results1.clearScreen).toBe(false)
    expect(results2.clearScreen).toBe(false)
  })

  test('plugin overrides `clearScreen` option', async () => {
    const config1: InlineConfig = { plugins: [keepScreenOverridePlugin()] }
    const config2: InlineConfig = {
      plugins: [keepScreenOverridePlugin()],
      clearScreen: true,
    }

    const results1 = await resolveConfig(config1, 'build')
    const results2 = await resolveConfig(config2, 'build')

    expect(results1.clearScreen).toBe(false)
    expect(results2.clearScreen).toBe(false)
  })

  test('resolveConfig with root path including "#" and "?" and "*" should warn ', async () => {
    expect.assertions(1)

    const logger = createLogger('info')
    logger.warn = (str) => {
      expect(str).to.include(
        'Consider renaming the directory / file to remove the characters',
      )
    }

    await resolveConfig({ root: './inc?ud#s*', customLogger: logger }, 'build')
  })

  test('syncs `build.rollupOptions` and `build.rolldownOptions`', async () => {
    const resolved = await resolveConfig({}, 'build')
    expect(resolved.build!.rollupOptions).toStrictEqual(
      resolved.build!.rolldownOptions,
    )
    expect(resolved.worker!.rollupOptions).toStrictEqual(
      resolved.worker!.rolldownOptions,
    )
    expect(resolved.optimizeDeps!.rollupOptions).toStrictEqual(
      resolved.optimizeDeps!.rolldownOptions,
    )
  })
})

test('config compat 1', async () => {
  const config = await resolveConfig(
    {
      resolve: {
        conditions: ['client1'],
      },
      ssr: {
        resolve: {
          conditions: ['ssr1'],
        },
      },
      plugins: [
        {
          name: 'test',
          config() {
            return {
              environments: {
                client: {
                  resolve: {
                    conditions: ['client2'],
                  },
                },
                ssr: {
                  resolve: {
                    conditions: ['ssr2'],
                  },
                },
              },
            }
          },
        },
      ],
    },
    'serve',
  )
  expect(config.resolve.conditions).toMatchInlineSnapshot(`
    [
      "client1",
      "client2",
    ]
  `)
  expect(config.environments.client.resolve.conditions).toMatchInlineSnapshot(`
    [
      "client1",
      "client2",
    ]
  `)
  expect(config.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "ssr1",
      "ssr2",
    ]
  `)
  expect(config.environments.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "ssr1",
      "ssr2",
    ]
  `)
})

test('config compat 2', async () => {
  const config = await resolveConfig(
    {
      environments: {
        client: {
          resolve: {
            conditions: ['client1'],
          },
        },
        ssr: {
          resolve: {
            conditions: ['ssr1'],
          },
        },
      },
      plugins: [
        {
          name: 'test',
          config() {
            return {
              resolve: {
                conditions: ['client2'],
              },
              ssr: {
                resolve: {
                  conditions: ['ssr2'],
                },
              },
            }
          },
        },
      ],
    },
    'serve',
  )
  expect(config.resolve.conditions).toMatchInlineSnapshot(`
    [
      "client2",
      "client1",
    ]
  `)
  expect(config.environments.client.resolve.conditions).toMatchInlineSnapshot(`
    [
      "client2",
      "client1",
    ]
  `)
  expect(config.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "ssr2",
      "ssr1",
    ]
  `)
  expect(config.environments.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "ssr2",
      "ssr1",
    ]
  `)
})

test('config compat 3', async () => {
  const config = await resolveConfig({}, 'serve')
  expect(config.resolve.conditions).toMatchInlineSnapshot(`
    [
      "module",
      "browser",
      "development|production",
    ]
  `)
  expect(config.environments.client.resolve.conditions).toMatchInlineSnapshot(`
    [
      "module",
      "browser",
      "development|production",
    ]
  `)
  expect(config.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "module",
      "node",
      "development|production",
    ]
  `)
  expect(config.environments.ssr.resolve?.conditions).toMatchInlineSnapshot(`
    [
      "module",
      "node",
      "development|production",
    ]
  `)
})

test('preTransformRequests', async () => {
  async function testConfig(inlineConfig: InlineConfig) {
    return Object.fromEntries(
      Object.entries(
        (await resolveConfig(inlineConfig, 'serve')).environments,
      ).map(([name, e]) => [name, e.dev.preTransformRequests]),
    )
  }

  expect(
    await testConfig({
      environments: {
        custom: {},
        customTrue: {
          dev: {
            preTransformRequests: true,
          },
        },
        customFalse: {
          dev: {
            preTransformRequests: false,
          },
        },
      },
    }),
  ).toMatchInlineSnapshot(`
    {
      "client": true,
      "custom": false,
      "customFalse": false,
      "customTrue": true,
      "ssr": false,
    }
  `)

  expect(
    await testConfig({
      server: {
        preTransformRequests: true,
      },
      environments: {
        custom: {},
        customTrue: {
          dev: {
            preTransformRequests: true,
          },
        },
        customFalse: {
          dev: {
            preTransformRequests: false,
          },
        },
      },
    }),
  ).toMatchInlineSnapshot(`
    {
      "client": true,
      "custom": true,
      "customFalse": false,
      "customTrue": true,
      "ssr": true,
    }
  `)

  expect(
    await testConfig({
      server: {
        preTransformRequests: false,
      },
      environments: {
        custom: {},
        customTrue: {
          dev: {
            preTransformRequests: true,
          },
        },
        customFalse: {
          dev: {
            preTransformRequests: false,
          },
        },
      },
    }),
  ).toMatchInlineSnapshot(`
    {
      "client": false,
      "custom": false,
      "customFalse": false,
      "customTrue": true,
      "ssr": false,
    }
  `)
})

describe('loadConfigFromFile', () => {
  const fixtures = path.resolve(import.meta.dirname, './fixtures/config')

  describe('load default files', () => {
    const root = path.resolve(fixtures, './loadConfigFromFile')

    let writtenConfig: string | undefined
    afterEach(() => {
      if (writtenConfig) {
        fs.unlinkSync(path.resolve(root, writtenConfig))
      }
      fs.unlinkSync(path.resolve(root, 'package.json'))
    })

    const writeConfig = (fileName: string, content: string) => {
      fs.writeFileSync(path.resolve(root, fileName), content)
      writtenConfig = fileName
    }
    const writePackageJson = (typeField: string | undefined) => {
      fs.writeFileSync(
        path.resolve(root, 'package.json'),
        JSON.stringify({
          name: '@vitejs/test-load-config-from-file',
          type: typeField,
        }),
      )
    }

    const canLoadConfig = async () => {
      const result = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        undefined,
        root,
      )
      expect(result).toBeTruthy()
      expect(result?.config).toStrictEqual({ define: { foo: 1 } })
      expect(path.normalize(result!.path)).toBe(
        path.resolve(root, writtenConfig!),
      )
    }

    const cases = [
      {
        fileName: 'vite.config.js',
        content: 'export default { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.js',
        content: 'export default { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.cjs',
        content: 'module.exports = { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.cjs',
        content: 'module.exports = { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.mjs',
        content: 'export default { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.mjs',
        content: 'export default { define: { foo: 1 } }',
      },
      {
        fileName: 'vite.config.ts',
        content: 'export default { define: { foo: 1 as number } }',
      },
      {
        fileName: 'vite.config.ts',
        content: 'export default { define: { foo: 1 as number } }',
      },
      {
        fileName: 'vite.config.mts',
        content: 'export default { define: { foo: 1 as number } }',
      },
      {
        fileName: 'vite.config.mts',
        content: 'export default { define: { foo: 1 as number } }',
      },
      {
        fileName: 'vite.config.cts',
        content: 'module.exports = { define: { foo: 1 as number } }',
      },
      {
        fileName: 'vite.config.cts',
        content: 'module.exports = { define: { foo: 1 as number } }',
      },
    ]

    for (const { fileName, content } of cases) {
      for (const typeField of [undefined, 'module']) {
        test(`load ${fileName}${typeField ? ' with package#type module' : ''}`, async () => {
          writePackageJson(typeField)
          writeConfig(fileName, content)
          await canLoadConfig()
        })
      }
    }
  })

  test('can import values', async () => {
    const { config } = (await loadConfigFromFile(
      {} as any,
      path.resolve(fixtures, './entry/vite.config.ts'),
      path.resolve(fixtures, './entry'),
    ))!
    expect(config).toMatchInlineSnapshot(`
      {
        "array": [
          [
            1,
            3,
          ],
          [
            2,
            4,
          ],
        ],
        "importsField": "imports-field",
        "moduleCondition": "import condition",
      }
    `)
  })

  test('loadConfigFromFile with import attributes', async () => {
    const { config } = (await loadConfigFromFile(
      {} as any,
      path.resolve(fixtures, './entry/vite.config.import-attributes.ts'),
      path.resolve(fixtures, './entry'),
    ))!
    expect(config).toMatchInlineSnapshot(`
        {
          "jsonValue": "vite",
        }
      `)
  })

  test('import.meta properties are supported', async () => {
    const { config } = (await loadConfigFromFile(
      {} as any,
      path.resolve(fixtures, './import-meta/vite.config.ts'),
      path.resolve(fixtures, './import-meta'),
    ))!

    const c = config as any
    expect(c.isMain).toBe(false)
    expect(c.url).toContain('file://')
    expect(c.dirname).toContain('import-meta')
    expect(c.filename).toContain('vite.config.ts')
    expect(c.resolved).toBe(c.url)
    expect(c.resolvedMultiline).toBe(c.url)
  })

  test('shebang is preserved at the top of the file', async () => {
    const { config } = (await loadConfigFromFile(
      {} as any,
      path.resolve(fixtures, './shebang/vite.config.ts'),
      path.resolve(fixtures, './shebang'),
    ))!

    const c = config as any
    expect(c.dirname).toContain('shebang')
  })

  describe('loadConfigFromFile with configLoader: native', () => {
    const fixtureRoot = path.resolve(fixtures, './native-import')

    test('imports a basic js config', async () => {
      const result = (await loadConfigFromFile(
        {} as any,
        path.resolve(fixtureRoot, 'basic.js'),
        fixtureRoot,
        undefined,
        undefined,
        'native',
      ))!
      expect(result.config).toMatchInlineSnapshot(`
        {
          "value": "works",
        }
      `)
      expect(result.dependencies.length).toBe(0)
    })
  })
})
