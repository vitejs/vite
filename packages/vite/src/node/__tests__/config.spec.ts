import { InlineConfig } from '..'
import {
  mergeConfig,
  resolveConfig,
  UserConfigExport,
  resolveEnvPrefix,
  UserConfig
} from '../config'
import expect from 'expect'

describe('mergeConfig', () => {
  it('handles configs with different alias schemas', () => {
    const baseConfig: UserConfigExport = {
      resolve: {
        alias: [
          {
            find: 'foo',
            replacement: 'foo-value'
          }
        ]
      }
    }

    const newConfig: UserConfigExport = {
      resolve: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value'
        }
      }
    }

    const mergedConfig: UserConfigExport = {
      resolve: {
        alias: [
          {
            find: 'foo',
            replacement: 'foo-value'
          },
          {
            find: 'bar',
            replacement: 'bar-value'
          },
          {
            find: 'baz',
            replacement: 'baz-value'
          }
        ]
      }
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  it('handles assetsInclude', () => {
    const baseConfig: UserConfigExport = {
      assetsInclude: 'some-string'
    }

    const newConfig: UserConfigExport = {
      assetsInclude: ['some-other-string', /regexp?/]
    }

    const mergedConfig: UserConfigExport = {
      assetsInclude: ['some-string', 'some-other-string', /regexp?/]
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  it('not handles alias not under `resolve`', () => {
    const baseConfig = {
      custom: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value'
        }
      }
    }

    const newConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          foo: 'foo-value'
        }
      }
    }

    const mergedConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          baz: 'baz-value',
          foo: 'foo-value'
        }
      }
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })
})

describe('resolveConfig', () => {
  it('copies optimizeDeps.keepNames to esbuildOptions.keepNames', async () => {
    const config: InlineConfig = {
      optimizeDeps: {
        keepNames: false
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          keepNames: false
        }
      }
    })
  })

  it('uses esbuildOptions.keepNames if set', async () => {
    const config: InlineConfig = {
      optimizeDeps: {
        keepNames: true,
        esbuildOptions: {
          keepNames: false
        }
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          keepNames: false
        }
      }
    })
  })
})

describe('resolveEnvPrefix', () => {
  it(`use 'VITE_' as default value`, () => {
    const config: UserConfig = {}
    expect(resolveEnvPrefix(config)).toMatchObject(['VITE_'])
  })

  it(`throw error if envPrefix contains ''`, () => {
    let config: UserConfig = { envPrefix: '' }
    expect(() => resolveEnvPrefix(config)).toThrow()
    config = { envPrefix: ['', 'CUSTOM_'] }
    expect(() => resolveEnvPrefix(config)).toThrow()
  })

  it('should work correctly for valid envPrefix value', () => {
    const config: UserConfig = { envPrefix: [' ', 'CUSTOM_'] }
    expect(resolveEnvPrefix(config)).toMatchObject([' ', 'CUSTOM_'])
  })
})

describe('preview config', () => {
  const serverConfig = () => ({
    port: 3003,
    strictPort: true,
    host: true,
    open: true,
    https: true,
    proxy: { '/foo': 'http://localhost:4567' },
    cors: false
  })

  it('preview inherits server config with default port', async () => {
    const config: InlineConfig = {
      server: serverConfig()
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: {
        ...serverConfig(),
        port: undefined
      }
    })
  })

  it('preview inherits server config with port override', async () => {
    const config: InlineConfig = {
      server: serverConfig(),
      preview: {
        port: 3006
      }
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: {
        ...serverConfig(),
        port: 3006
      }
    })
  })

  const previewConfig = () => ({
    port: 3006,
    strictPort: false,
    open: false,
    host: false,
    https: false,
    proxy: { '/bar': 'http://localhost:3010' },
    cors: true
  })

  it('preview overrides server config', async () => {
    const config: InlineConfig = {
      server: serverConfig(),
      preview: previewConfig()
    }
    expect(await resolveConfig(config, 'serve')).toMatchObject({
      preview: previewConfig()
    })
  })
})
